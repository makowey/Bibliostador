<script lang="ts">
	import type { GameState } from '$lib/smart-socket';

	interface Props {
		gameState: GameState;
		onterritoryClick?: (event: { territoryId: string }) => void;
		attackableTerritories?: string[];
		isMyTurn?: boolean;
		showAttackableHighlight?: boolean;
	}

	let { gameState, onterritoryClick, attackableTerritories = [], isMyTurn = false, showAttackableHighlight = false }: Props = $props();

	// 12 Territories mapped to biblical regions (4 per player, no neutrals)
	const territories = {
		// Player 1 (Blue) - Southern Kingdom with Jerusalem as capital
		jerusalem: { name: 'Jerusalem', capital: true, color: 'blue', region: 'judah' },
		judah: { name: 'Judah', capital: false, color: 'blue', region: 'judah' },
		benjamin: { name: 'Benjamin', capital: false, color: 'blue', region: 'benjamin' },
		simeon: { name: 'Simeon', capital: false, color: 'blue', region: 'simeon' },

		// Player 2 (Red) - Central Kingdom with Samaria as capital
		samaria: { name: 'Samaria', capital: true, color: 'red', region: 'ephraim' },
		ephraim: { name: 'Ephraim', capital: false, color: 'red', region: 'ephraim' },
		manasseh: { name: 'Manasseh', capital: false, color: 'red', region: 'manasseh' },
		dan: { name: 'Dan', capital: false, color: 'red', region: 'dan' },

		// Player 3 (Gold) - Northern Kingdom with Gaza as capital
		gaza: { name: 'Gaza', capital: true, color: 'gold', region: 'gaza' },
		galilee: { name: 'Galilee', capital: false, color: 'gold', region: 'galilee' },
		asher: { name: 'Asher', capital: false, color: 'gold', region: 'asher' },
		nafali: { name: 'Nafali', capital: false, color: 'gold', region: 'nafali' }
	};

	function getTerritoryOwner(territoryId: string): string | null {
		if (!gameState.territories) return null;
		return gameState.territories[territoryId] || null;
	}

	function getPlayerColor(playerId: string | null): string {
		if (!playerId) return 'rgba(229, 231, 235, 0.3)'; // neutral gray
		const player = gameState.players.find(p => p.id === playerId);
		if (!player) return 'rgba(229, 231, 235, 0.3)';
		
		switch (player.color) {
			case 'blue': return 'rgba(59, 130, 246, 0.6)';
			case 'red': return 'rgba(239, 68, 68, 0.6)';
			case 'gold': return 'rgba(245, 158, 11, 0.6)';
			default: return 'rgba(229, 231, 235, 0.3)';
		}
	}

	function handleTerritoryClick(territoryId: string) {
		// Only allow clicking if it's during territory selection and this territory is attackable
		if (showAttackableHighlight && isMyTurn && attackableTerritories.includes(territoryId)) {
			onterritoryClick?.({ territoryId });
		} else if (!showAttackableHighlight) {
			// Always allow clicks when not in selection mode (for general map interaction)
			onterritoryClick?.({ territoryId });
		}
	}

	function getTerritoryClasses(territoryId: string) {
		let classes = "territory-overlay rounded-lg border-2 p-2 text-center transition-all duration-300";
		
		if (showAttackableHighlight && isMyTurn) {
			if (attackableTerritories.includes(territoryId)) {
				classes += " cursor-pointer border-red-600 hover:border-red-800 hover:scale-105 attackable-glow";
			} else {
				classes += " cursor-not-allowed border-gray-400 opacity-60";
			}
		} else {
			classes += " cursor-pointer border-amber-600 hover:border-amber-800 hover:scale-105";
		}
		
		return classes;
	}
</script>

<div class="canaan-map bg-amber-50 border-2 border-amber-500 rounded-xl p-4">
	<h3 class="text-lg font-semibold text-amber-800 mb-4 text-center">
		<i class="fas fa-map mr-2"></i>12 Tribes of Israel
		{#if showAttackableHighlight && isMyTurn}
			<span class="block text-sm text-red-600 mt-1">
				<i class="fas fa-crosshairs mr-1"></i>Click highlighted territories to attack
			</span>
		{/if}
	</h3>
	
	{#if !gameState || !gameState.players}
		<div class="text-center text-gray-500 py-8">
			<i class="fas fa-spinner fa-spin mr-2"></i>Loading game...
		</div>
	{:else}

	<!-- Israel Map with Interactive Territories -->
	<div class="map-container relative w-full h-96 border border-amber-300 rounded-lg overflow-hidden">
		<!-- Base Map -->
		<img 
			src="/assets/12_Tribes_of_Israel_Map.svg" 
			alt="12 Tribes of Israel Map" 
			class="w-full h-full object-contain"
		/>
		
		<!-- Interactive Territory Overlays -->
		<div class="absolute inset-0 grid grid-cols-3 gap-1 p-4">
			{#each Object.entries(territories) as [territoryId, territory]}
				{@const owner = getTerritoryOwner(territoryId)}
				{@const color = getPlayerColor(owner)}
				
				<div 
					class={getTerritoryClasses(territoryId)}
					style="background-color: {color};"
					onclick={() => handleTerritoryClick(territoryId)}
					onkeydown={(e) => e.key === 'Enter' && handleTerritoryClick(territoryId)}
					role="button"
					tabindex="0"
					aria-label="Territory {territory.name} {owner ? `owned by ${gameState.players.find(p => p.id === owner)?.name}` : 'neutral'}"
				>
					<div class="text-xs font-semibold text-amber-900 relative">
						{#if territory.capital}
							<i class="fas fa-crown mr-1"></i>
						{/if}
						{territory.name}
						
						{#if showAttackableHighlight && isMyTurn && attackableTerritories.includes(territoryId)}
							<div class="absolute -top-1 -right-1">
								<i class="fas fa-crosshairs text-red-600 text-sm animate-pulse"></i>
							</div>
						{/if}
					</div>
					{#if owner}
						{@const player = gameState.players.find(p => p.id === owner)}
						{#if player}
							<div class="text-xs text-white font-bold mt-1">
								{player.name}
							</div>
						{/if}
					{:else}
						<div class="text-xs text-gray-600 mt-1">Neutral</div>
					{/if}
				</div>
			{/each}
		</div>
	</div>
	
	<!-- Player legend -->
	<div class="mt-4 grid grid-cols-3 gap-2 text-sm">
		{#each gameState.players as player}
			<div class="flex items-center justify-center p-2 bg-white rounded border">
				<div class="w-4 h-4 rounded-full mr-2 {player.color === 'blue' ? 'bg-blue-500' : player.color === 'red' ? 'bg-red-500' : 'bg-yellow-500'}"></div>
				<span class="font-medium">{player.name}</span>
				<div class="ml-1 text-xs text-gray-600">({player.capitalCity})</div>
			</div>
		{/each}
	</div>
	{/if}
</div>

<style>
	.territory-overlay {
		min-height: 60px;
		display: flex;
		flex-direction: column;
		justify-content: center;
	}
	
	.territory-overlay:hover {
		filter: brightness(1.1);
		box-shadow: 0 4px 8px rgba(0,0,0,0.2);
	}

	.attackable-glow {
		box-shadow: 0 0 15px rgba(220, 38, 38, 0.5), inset 0 0 15px rgba(220, 38, 38, 0.1);
		animation: pulse-glow 2s infinite;
	}

	@keyframes pulse-glow {
		0%, 100% {
			box-shadow: 0 0 15px rgba(220, 38, 38, 0.5), inset 0 0 15px rgba(220, 38, 38, 0.1);
		}
		50% {
			box-shadow: 0 0 25px rgba(220, 38, 38, 0.8), inset 0 0 25px rgba(220, 38, 38, 0.2);
		}
	}
	
	@keyframes conquest {
		0% { transform: scale(1); }
		50% { transform: scale(1.1); }
		100% { transform: scale(1); }
	}
	
	.territory-overlay.conquered {
		animation: conquest 0.6s ease-in-out;
	}
	
	.map-container {
		position: relative;
		background: linear-gradient(135deg, #fef3c7 0%, #f3e8ff 100%);
	}
</style>