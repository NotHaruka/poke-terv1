import { BattleState, BattlePhase } from './BattleState.js';
import { BattleContext } from './BattleContext.js';
import { BattleActionQueue } from './BattleActionQueue.js';
import { BattleAction, BattleActionType, MoveAction, ItemAction } from './BattleAction.js';
import { BattleEventType, BattleEvent } from './BattleEvents.js';
import { DamageCalculator } from '../../shared/battleFormulas/calculators/DamageCalculator.js';
import { AccuracyCalculator } from '../../shared/battleFormulas/calculators/AccuracyCalculator.js';
import { CriticalHitCalculator } from '../../shared/battleFormulas/calculators/CriticalHitCalculator.js';
import { TypeEffectivenessCalculator } from '../../shared/battleFormulas/calculators/TypeEffectivenessCalculator.js';
import { StatusPipeline } from './effects/StatusPipeline.js';
import { AbilityPipeline } from './effects/AbilityPipeline.js';
import { ItemPipeline } from './effects/ItemPipeline.js';
import { CaptureManager } from './capture/CaptureManager.js';
import { CaptureContext } from './capture/CaptureContext.js';
import { LegacyItemCategory } from '../../shared/pokemonData.js';

import { ActionProvider } from './providers/ActionProvider.js';
import { HumanActionProvider } from './providers/HumanActionProvider.js';

export class BattleInstance {
  public state: BattleState;
  public context: BattleContext;
  public actionQueue: BattleActionQueue;
  public providers: Map<string, ActionProvider> = new Map();

  constructor(id: string) {
    this.state = new BattleState(id);
    this.context = new BattleContext(this.state);
    this.actionQueue = new BattleActionQueue();
  }

  public setProvider(participantId: string, provider: ActionProvider): void {
    this.providers.set(participantId, provider);
  }

  public getProvider(participantId: string): ActionProvider | undefined {
    return this.providers.get(participantId);
  }

  public async requestTurnActions(): Promise<void> {
    if (this.state.phase !== BattlePhase.Init && this.state.phase !== BattlePhase.ActionSelection) {
      return;
    }
    this.state.phase = BattlePhase.ActionSelection;

    const activeParticipants = Array.from(this.state.participants.values()).filter(p => {
      const activeMon = p.party[p.activePokemonIndex];
      return activeMon && activeMon.currentHp > 0;
    });

    const actionPromises = activeParticipants.map(async (participant) => {
      let provider = this.providers.get(participant.id);
      if (!provider) {
        // Fallback default provider
        provider = new HumanActionProvider(participant.id);
        this.providers.set(participant.id, provider);
      }

      try {
        const action = await provider.getAction(this.context);
        if (action && !this.actionQueue.getActionForParticipant(participant.id)) {
          this.actionQueue.queueAction(action);
        }
      } catch (err) {
        console.warn(`[BattleInstance] Action collection error for ${participant.id}:`, err);
      }
    });

    await Promise.all(actionPromises);

    if (this.actionQueue.hasAllActions(activeParticipants.length) && this.state.phase === BattlePhase.ActionSelection) {
      this.resolveTurn();
    }
  }

  public submitAction(action: BattleAction) {
    const participant = this.context.getParticipant(action.participantId);
    if (!participant) {
      throw new Error("Invalid participant ID");
    }

    const provider = this.providers.get(action.participantId);
    if (provider && provider.submitAction) {
      provider.submitAction(action);
    }

    if (!this.actionQueue.getActionForParticipant(action.participantId)) {
      this.actionQueue.queueAction(action);
    }

    const activeCount = Array.from(this.state.participants.values()).filter(p => {
      const activeMon = p.party[p.activePokemonIndex];
      return activeMon && activeMon.currentHp > 0;
    }).length;

    if (this.actionQueue.hasAllActions(activeCount) && this.state.phase !== BattlePhase.Execution && this.state.phase !== BattlePhase.End) {
      this.resolveTurn();
    }
  }

  private resolveTurn() {
    this.state.phase = BattlePhase.Execution;
    this.state.events = [];

    // Turn Start Events
    this.emitEvent({ type: BattleEventType.TurnStart });

    // Sort actions
    const orderedActions = this.actionQueue.sortAndResolve(this.context);
    
    // Execute Actions
    for (const action of orderedActions) {
      this.executeAction(action);
      
      if (this.checkBattleEnd()) {
        break;
      }
    }

    // Turn End Events
    if (!this.checkBattleEnd()) {
      this.emitEvent({ type: BattleEventType.TurnEnd });
      
      // Clear action queue and move to next turn
      this.actionQueue.clear();
      this.state.turn++;
      this.state.phase = BattlePhase.ActionSelection;
    }
  }

  private executeAction(action: BattleAction) {
    const participant = this.context.getParticipant(action.participantId);
    if (!participant) return;
    
    const activePokemon = participant.party[participant.activePokemonIndex];
    if (activePokemon.currentHp <= 0 && action.type !== BattleActionType.Switch) {
      return; // Cannot execute action if fainted
    }

    switch (action.type) {
      case BattleActionType.Switch:
        this.handleSwitch(action.participantId, action.nextPokemonId);
        break;
      case BattleActionType.Move:
        this.handleMove(action as MoveAction);
        break;
      case BattleActionType.Item:
        this.handleItem(action as ItemAction);
        break;
      case BattleActionType.Run:
        // Handle Run
        break;
    }
  }

  private handleItem(action: ItemAction) {
    const itemData = { id: String(action.itemId), name: `Item ${action.itemId}`, description: '', price: 0, category: LegacyItemCategory.CaptureDevice as any, isKeyItem: false }; // Mock item lookup for now
    if (itemData.category === LegacyItemCategory.CaptureDevice) {
      const captureContext: CaptureContext = {
        battle: this,
        participantId: action.participantId,
        targetId: action.targetId,
        ballItem: itemData
      };
      
      const captureResult = CaptureManager.attemptCapture(captureContext);
      
      if (!captureResult.success) {
        if (captureResult.reason !== 'broke_free') {
           this.emitEvent({ type: BattleEventType.Message, payload: { text: `You can't use that here! (${captureResult.reason})` } });
        } else {
           this.emitEvent({ type: BattleEventType.Message, payload: { text: "Oh no! The Pokemon broke free!" } });
        }
      }
    }
  }

  private handleSwitch(participantId: string, nextPokemonId: string) {
    const participant = this.context.getParticipant(participantId);
    if (!participant) return;

    const nextIndex = participant.party.findIndex(p => p.id === nextPokemonId);
    if (nextIndex !== -1 && participant.party[nextIndex].currentHp > 0) {
      participant.activePokemonIndex = nextIndex;
      const nextMon = participant.party[nextIndex];
      this.emitEvent({
        type: BattleEventType.Message,
        payload: { text: `${participant.name} sent out ${nextMon.nickname || 'a Pokemon'}!` }
      });
      this.emitEvent({
        type: BattleEventType.Switch,
        payload: { participantId, nextPokemonIndex: nextIndex }
      });
    }
  }

  private handleMove(action: MoveAction) {
    const attackerPart = this.context.getParticipant(action.participantId);
    const defenderPart = this.context.getParticipant(action.targetId);
    if (!attackerPart || !defenderPart) return;

    const attacker = attackerPart.party[attackerPart.activePokemonIndex];
    const defender = defenderPart.party[defenderPart.activePokemonIndex];
    
    if (attacker.currentHp <= 0 || defender.currentHp <= 0) return;

    // Check status constraints (sleep, freeze, paralysis)
    const statusCheck = StatusPipeline.canAttack(attacker, this.context);
    if (!statusCheck.canAttack) {
      if (statusCheck.reason) {
        this.emitEvent({
          type: BattleEventType.Message,
          payload: { text: statusCheck.reason }
        });
      }
      return;
    }

    // Mock move lookup
    const move = { id: action.moveId, name: `Move ${action.moveId}`, category: 0, power: 40, type: 0, accuracy: 100 };

    this.emitEvent({
      type: BattleEventType.Message,
      payload: { text: `${attacker.nickname || 'Pokemon'} used ${move.name}!` }
    });

    this.emitEvent({ type: BattleEventType.BeforeMove, payload: { action } });

    // Accuracy Check
    if (!AccuracyCalculator.calculate(attacker, defender, move)) {
      this.emitEvent({
        type: BattleEventType.Message,
        payload: { text: "But it missed!" }
      });
      return;
    }

    // Damage Calculation
    const isCritical = CriticalHitCalculator.calculate(attacker, move);
    const typeEffectiveness = TypeEffectivenessCalculator.calculate(move.type, [0, null] /* placeholder defender types */);
    
    const damageContext = {
      attacker,
      defender,
      move,
      isCritical,
      typeEffectiveness,
      randomFactor: 0.85 + Math.random() * 0.15,
      weather: this.state.weather || 'clear',
      attackerStages: (attacker as any).statStages || {},
      defenderStages: (defender as any).statStages || {}
    };
    
    const damage = DamageCalculator.calculateDamage(damageContext);

    // Apply Damage
    this.emitEvent({ type: BattleEventType.BeforeDamage, payload: { targetId: action.targetId, damage } });
    
    defender.currentHp = Math.max(0, defender.currentHp - damage);

    this.emitEvent({ type: BattleEventType.Damage, payload: { targetId: action.targetId, damage, isCritical, typeEffectiveness } });
    
    if (isCritical) {
      this.emitEvent({ type: BattleEventType.Message, payload: { text: "A critical hit!" } });
    }
    if (typeEffectiveness > 1) {
      this.emitEvent({ type: BattleEventType.Message, payload: { text: "It's super effective!" } });
    } else if (typeEffectiveness > 0 && typeEffectiveness < 1) {
      this.emitEvent({ type: BattleEventType.Message, payload: { text: "It's not very effective..." } });
    } else if (typeEffectiveness === 0) {
      this.emitEvent({ type: BattleEventType.Message, payload: { text: "It had no effect!" } });
    }

    this.emitEvent({ type: BattleEventType.AfterDamage, payload: { targetId: action.targetId, damage } });
    this.emitEvent({ type: BattleEventType.AfterMove, payload: { action } });

    if (defender.currentHp <= 0) {
      this.emitEvent({
        type: BattleEventType.Message,
        payload: { text: `${defender.nickname || 'Pokemon'} fainted!` }
      });
      this.emitEvent({ type: BattleEventType.PokemonFainted, payload: { participantId: action.targetId } });
    }
  }

  private emitEvent(event: BattleEvent) {
    this.state.events.push(event);
    
    // Process pipelines reacting to events
    AbilityPipeline.processEvent(this.context, event);
    ItemPipeline.processEvent(this.context, event);
    StatusPipeline.processEvent(this.context, event);
  }

  private checkBattleEnd(): boolean {
    // Basic check: if any side has no usable pokemon
    let allP1Fainted = true;
    let allP2Fainted = true;

    const participants = Array.from(this.state.participants.values());
    if (participants.length < 2) return false;

    const p1 = participants[0];
    const p2 = participants[1];

    if (p1.party.some(p => p.currentHp > 0)) allP1Fainted = false;
    if (p2.party.some(p => p.currentHp > 0)) allP2Fainted = false;

    if (allP1Fainted || allP2Fainted) {
      this.state.phase = BattlePhase.End;
      this.emitEvent({ type: BattleEventType.BattleEnded });
      return true;
    }

    return false;
  }
}