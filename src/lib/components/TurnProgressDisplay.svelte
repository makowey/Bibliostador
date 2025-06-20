<script lang="ts">
	import type { GameState } from '$lib/vercel-socket';

	interface Props {
		gameState: GameState;
	}

	let { gameState }: Props = $props();

	function getTurnStatus(round: number, turn: number, playerIndex: number) {
		const currentRound = gameState.round;
		const currentTurn = gameState.turn;
		const currentPlayer = gameState.currentPlayerIndex;

		if (round < currentRound) {
			return 'completed';
		} else if (round === currentRound) {
			if (turn < currentTurn) {
				return 'completed';
			} else if (turn === currentTurn) {
				if (playerIndex < currentPlayer) {
					return 'completed';
				} else if (playerIndex === currentPlayer) {
					return 'active';
				} else {
					return 'pending';
				}
			} else {
				return 'pending';
			}
		} else {
			return 'pending';
		}
	}

	function getPlayerColor(playerIndex: number): string {
		const colors = ['blue', 'red', 'gold'];
		return colors[playerIndex] || 'gray';
	}
</script>

<div class="turn-progress bg-amber-50 border-2 border-amber-300 rounded-lg p-4">
	<h3 class="text-lg font-semibold text-amber-800 mb-4 text-center">
		<i class="fas fa-chess mr-2"></i>Turn Progress
	</h3>
	
	<!-- Current Round Display -->
	{#if gameState}
		{@const currentRound = gameState.round}
		<div class="round-container">
		<div class="flex items-center justify-between mb-3">
			<h4 class="text-sm font-semibold text-amber-700">Round {currentRound} of {gameState.gameSettings?.maxRounds || 3}</h4>
			<div class="flex items-center gap-1">
				<span class="text-xs text-amber-600 mr-2">Progress:</span>
				{#each Array(gameState.gameSettings?.maxRounds || 3) as _, roundIndex}
					{@const round = roundIndex + 1}
					<div class="w-3 h-3 rounded-full border transition-all duration-300
						{round < currentRound ? 'bg-green-500 border-green-600' : 
						 round === currentRound ? 'bg-amber-500 border-amber-600 ring-2 ring-amber-300' : 
						 'bg-gray-200 border-gray-300'}"
						title="Round {round} {round < currentRound ? '(Completed)' : round === currentRound ? '(Current)' : '(Upcoming)'}"
					>
					</div>
				{/each}
			</div>
		</div>
		
		<div class="grid grid-cols-3 gap-3">
			{#each Array(gameState.gameSettings?.turnsPerPlayerPerRound || 3) as _, turnIndex}
				{@const turn = turnIndex + 1}
				<div class="turn-group">
					<div class="text-xs text-gray-600 mb-2 text-center font-medium">Turn {turn}</div>
					<div class="flex gap-1 justify-center">
						{#each gameState.players as player, playerIndex}
							{@const status = getTurnStatus(currentRound, turn, playerIndex)}
							{@const color = getPlayerColor(playerIndex)}
							<div 
								class="turn-indicator w-8 h-8 rounded-full border-2 transition-all duration-300 flex items-center justify-center text-xs font-bold
									{status === 'completed' ? (color === 'blue' ? 'bg-blue-500 border-blue-600 text-white opacity-80' : 
															  color === 'red' ? 'bg-red-500 border-red-600 text-white opacity-80' : 
															  'bg-yellow-500 border-yellow-600 text-white opacity-80') :
									 status === 'active' ? (color === 'blue' ? 'bg-blue-500 border-blue-600 text-white shadow-lg animate-pulse ring-2 ring-blue-300' : 
														   color === 'red' ? 'bg-red-500 border-red-600 text-white shadow-lg animate-pulse ring-2 ring-red-300' : 
														   'bg-yellow-500 border-yellow-600 text-white shadow-lg animate-pulse ring-2 ring-yellow-300') :
									 'bg-gray-200 border-gray-300 text-gray-500 opacity-50'}"
								title="{player.name} - Round {currentRound}, Turn {turn}"
							>
								{player.name.charAt(0)}
							</div>
						{/each}
					</div>
				</div>
			{/each}
		</div>
		</div>
	{/if}

	<!-- Legend -->
	<div class="mt-4 pt-3 border-t border-amber-300">
		<div class="flex justify-center gap-4 text-xs">
			<div class="flex items-center gap-1">
				<div class="w-3 h-3 rounded-full bg-blue-500 opacity-70"></div>
				<span>Completed</span>
			</div>
			<div class="flex items-center gap-1">
				<div class="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></div>
				<span>Active</span>
			</div>
			<div class="flex items-center gap-1">
				<div class="w-3 h-3 rounded-full bg-gray-200 opacity-40"></div>
				<span>Pending</span>
			</div>
		</div>
	</div>
</div>

<style>
	.turn-indicator {
		min-width: 2rem;
		min-height: 2rem;
	}
	
	.turn-progress {
		max-height: 400px;
		overflow-y: auto;
	}
	
	.round-container {
		padding: 8px;
		background: rgba(255, 255, 255, 0.6);
		border-radius: 6px;
		border: 1px solid rgba(245, 158, 11, 0.2);
	}
</style>