<script lang="ts">
	import { onMount } from 'svelte';
	import Timer from '$lib/components/Timer.svelte';
	import CanaanMap from '$lib/components/CanaanMap.svelte';
	import TurnProgressDisplay from '$lib/components/TurnProgressDisplay.svelte';
	import DebugPanel from '$lib/components/DebugPanel.svelte';
	import DuelModal from '$lib/components/DuelModal.svelte';
	// Smart socket: WebSocket for local development, Vercel HTTP for production
	import { socketService, gameState, isConnected } from '$lib/smart-socket.js';

	let playerName = $state('');
	let roomId = $state('');
	let aiPlayerCount = $state(2); // Default to 2 AI players
	let myPlayerId = $state('');
	let numericalInput: HTMLInputElement | undefined = undefined;
	let textAnswer = $state('');
	let lastGamePhase = $state('');
	let hasSubmittedAnswer = $state(false);
	let selectedAnswerIndex = $state<number | null>(null);
	let isDuelModalOpen = $state(false);
	let territoryFeedback = $state<{message: string, type: 'success' | 'error' | 'info'} | null>(null);

	onMount(() => {
		socketService.connect();
	});

	// Handle phase changes and timer expiry for auto-submit
	$effect(() => {
		if ($gameState?.phase !== lastGamePhase) {
			lastGamePhase = $gameState?.phase || '';
			hasSubmittedAnswer = false; // Reset on phase change
			selectedAnswerIndex = null; // Reset selected answer on phase change
			textAnswer = ''; // Reset text answer on phase change
		}
		
		// Update hasSubmittedAnswer based on actual game state
		if ($gameState?.phase === 'duel') {
			hasSubmittedAnswer = hasCurrentPlayerSubmitted();
			isDuelModalOpen = true;
		} else {
			isDuelModalOpen = false;
		}

		// Force close modal if timer has been at 0 for too long (safety mechanism)
		if ($gameState?.phase === 'duel' && $gameState?.timeRemaining <= 0) {
			setTimeout(() => {
				if ($gameState?.phase === 'duel' && $gameState?.timeRemaining <= 0) {
					console.log('Force closing modal due to timeout');
					isDuelModalOpen = false;
				}
			}, 3000); // Give 3 seconds for server to process results
		}

		// Auto-submit any available answer when timer expires
		if ($gameState?.phase === 'duel' && 
			$gameState?.timeRemaining === 0 && 
			!hasCurrentPlayerSubmitted()) {
			
			const myPlayer = $gameState.players.find(p => !p.id.startsWith('ai_'));
			const isParticipant = myPlayer && ($gameState.currentDuel?.attackerId === myPlayer.id || $gameState.currentDuel?.defenderId === myPlayer.id);
			
			if (isParticipant) {
				let answerToSubmit = null;
				
				if ($gameState.currentQuestion?.type === 'numerical' && numericalInput?.value?.trim()) {
					answerToSubmit = parseInt(numericalInput.value);
					console.log('Auto-submitting numerical answer on timer expiry:', answerToSubmit);
				} else if ($gameState.currentQuestion?.type === 'text' && textAnswer?.trim()) {
					answerToSubmit = textAnswer.trim();
					console.log('Auto-submitting text answer on timer expiry:', answerToSubmit);
				}
				
				if (answerToSubmit !== null) {
					submitDuelAnswer(answerToSubmit);
				}
			}
		}
	});

	function createRoom() {
		if (playerName.trim()) {
			socketService.createRoom(playerName.trim(), aiPlayerCount);
		}
	}

	function joinRoom() {
		if (playerName.trim() && roomId.trim()) {
			socketService.joinRoom(roomId.trim().toUpperCase(), playerName.trim());
		}
	}

	function readyUp() {
		socketService.readyUp();
	}

	function submitAnswer(answerIndex: number) {
		socketService.submitAnswer(answerIndex);
	}

	function submitDuelAnswer(answerIndex: number | string) {
		socketService.submitDuelAnswer(answerIndex);
		if (typeof answerIndex === 'number') {
			selectedAnswerIndex = answerIndex;
		}
	}

	// Check if current player has already submitted their answer
	function hasCurrentPlayerSubmitted(): boolean {
		if (!$gameState?.currentDuel || !$gameState?.playerAnswers) return false;
		const myPlayer = $gameState.players.find(p => !p.id.startsWith('ai_'));
		if (!myPlayer) return false;
		return !!$gameState.playerAnswers[myPlayer.id];
	}

	function selectTerritory(targetTerritoryId: string) {
		socketService.selectTerritory(targetTerritoryId);
	}

	// Territory adjacency map (same as server)
	const territoryAdjacency = {
		jerusalem: ['samaria', 'judah', 'benjamin'],
		judah: ['jerusalem', 'benjamin', 'simeon', 'gaza'],
		benjamin: ['jerusalem', 'judah', 'ephraim', 'dan'],
		simeon: ['judah', 'gaza', 'dan'],
		samaria: ['jerusalem', 'ephraim', 'manasseh', 'galilee'],
		ephraim: ['samaria', 'benjamin', 'manasseh', 'dan'],
		manasseh: ['samaria', 'ephraim', 'galilee', 'asher'],
		dan: ['benjamin', 'ephraim', 'simeon', 'gaza'],
		gaza: ['judah', 'simeon', 'dan', 'galilee'],
		galilee: ['samaria', 'manasseh', 'gaza', 'asher', 'nafali'],
		asher: ['manasseh', 'galilee', 'nafali'],
		nafali: ['galilee', 'asher']
	};

	// Get territories that current player can attack
	function getAttackableTerritories(gameState: any, playerId: string) {
		if (!gameState?.territories) return [];
		
		const playerTerritories = Object.keys(gameState.territories).filter(
			territoryId => gameState.territories[territoryId] === playerId
		);
		
		const attackableSet = new Set();
		
		playerTerritories.forEach(playerTerritory => {
			const adjacentTerritories = territoryAdjacency[playerTerritory] || [];
			adjacentTerritories.forEach(adjacentTerritory => {
				const owner = gameState.territories[adjacentTerritory];
				if (owner && owner !== playerId) {
					attackableSet.add(adjacentTerritory);
				}
			});
		});
		
		return Array.from(attackableSet) as string[];
	}

	function handleTerritoryClick(event: { territoryId: string }) {
		const territoryId = event.territoryId;
		console.log('Territory clicked:', territoryId);
		
		// Clear previous feedback
		territoryFeedback = null;
		
		// If it's territory selection phase and my turn, try to attack this territory
		if ($gameState?.phase === 'territory_selection') {
			const currentPlayer = $gameState.players[$gameState.currentPlayerIndex];
			const myPlayer = $gameState.players.find(p => !p.id.startsWith('ai_'));
			const isMyTurn = currentPlayer && myPlayer && currentPlayer.id === myPlayer.id;
			
			console.log('Territory selection check:', {
				phase: $gameState.phase,
				isMyTurn,
				currentPlayer: currentPlayer?.name,
				myPlayer: myPlayer?.name,
				territoryId
			});
			
			if (!isMyTurn) {
				showTerritoryFeedback(`It's ${currentPlayer?.name}'s turn, not yours!`, 'info');
				return;
			}
			
			const attackableTerritories = getAttackableTerritories($gameState, myPlayer.id);
			console.log('Attackable territories:', attackableTerritories);
			
			if (attackableTerritories.includes(territoryId)) {
				console.log('Attacking territory:', territoryId);
				const territoryName = territoryId.charAt(0).toUpperCase() + territoryId.slice(1);
				showTerritoryFeedback(`Attacking ${territoryName}!`, 'success');
				selectTerritory(territoryId);
			} else {
				// Provide specific feedback based on why it's not attackable
				const territoryOwner = $gameState.territories?.[territoryId];
				const ownerPlayer = $gameState.players.find(p => p.id === territoryOwner);
				const territoryName = territoryId.charAt(0).toUpperCase() + territoryId.slice(1);
				
				if (territoryOwner === myPlayer.id) {
					showTerritoryFeedback(`${territoryName} is already yours!`, 'error');
				} else if (!territoryOwner) {
					showTerritoryFeedback(`${territoryName} has no owner`, 'error');
				} else {
					showTerritoryFeedback(`${territoryName} is not adjacent to your territories`, 'error');
				}
			}
		} else {
			showTerritoryFeedback('You can only attack during territory selection phase', 'info');
		}
	}

	function showTerritoryFeedback(message: string, type: 'success' | 'error' | 'info') {
		territoryFeedback = { message, type };
		// Auto-clear feedback after 3 seconds
		setTimeout(() => {
			territoryFeedback = null;
		}, 3000);
	}

	function addAIPlayer() {
		socketService.addAIPlayer();
	}
</script>

<div class="max-w-6xl mx-auto p-4 sm:p-8">
	<header class="text-center mb-8">
		<h1 class="text-4xl sm:text-5xl font-bold text-amber-800 mb-2">
			<i class="fas fa-crown mr-3"></i>Bibliostador<i class="fas fa-crown ml-3"></i>
		</h1>
		<p class="text-lg text-amber-700">
			<i class="fas fa-map mr-2"></i>Conquer the Promised Land through Bible Knowledge
		</p>
	</header>

	{#if !$gameState}
		<div class="card-biblical max-w-md mx-auto">
			<div class="mb-6">
				<label for="playerName" class="block text-sm font-medium text-amber-800 mb-2">Your Name:</label>
				<input
					id="playerName"
					bind:value={playerName}
					placeholder="Enter your name"
					maxlength="20"
					class="input-biblical"
				/>
			</div>

			<div class="mb-6">
				<label for="aiCount" class="block text-sm font-medium text-amber-800 mb-2">
					<i class="fas fa-robot mr-1"></i>AI Players to Add:
				</label>
				<select id="aiCount" bind:value={aiPlayerCount} class="input-biblical">
					<option value={0}>0 AI Players (Humans only)</option>
					<option value={1}>1 AI Player</option>
					<option value={2}>2 AI Players (Default)</option>
				</select>
				<div class="text-xs text-gray-600 mt-1">
					<i class="fas fa-info-circle mr-1"></i>
					Total players: You + {aiPlayerCount} AI = {1 + aiPlayerCount}/3
				</div>
			</div>

			<div class="space-y-4 mb-6">
				<button onclick={createRoom} disabled={!playerName.trim() || !$isConnected} class="btn-biblical w-full">
					<i class="fas fa-plus mr-2"></i>Create New Room
				</button>
				
				<div class="flex gap-2">
					<input
						bind:value={roomId}
						placeholder="Room Code"
						maxlength="6"
						style="text-transform: uppercase"
						class="input-biblical flex-1"
					/>
					<button onclick={joinRoom} disabled={!playerName.trim() || !roomId.trim() || !$isConnected} class="btn-biblical">
						<i class="fas fa-sign-in-alt mr-2"></i>Join
					</button>
				</div>
			</div>

			<div class="text-center font-semibold">
				<i class="fas {$isConnected ? 'fa-wifi text-green-600' : 'fa-wifi-slash text-red-600'} mr-2"></i>
				{$isConnected ? 'Connected' : 'Disconnected'}
			</div>
		</div>
	{:else}
		<!-- Turn Progress Panel - Full Width at Top -->
		{#if $gameState.phase !== 'waiting'}
			<div class="card-biblical mb-6">
				<TurnProgressDisplay gameState={$gameState} />
			</div>
		{/if}

		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
			<!-- Game Panel -->
			<div class="card-biblical">
				<div class="text-center mb-6">
					<h2 class="text-2xl font-bold text-amber-800">Room {$gameState.id}</h2>
					<p class="text-amber-700">
						Round {$gameState.round}/{$gameState.gameSettings?.maxRounds || 6} | 
						Turn {$gameState.turn}/{$gameState.gameSettings?.turnsPerPlayerPerRound || 3} | 
						Phase: {$gameState.phase}
					</p>
					{#if $gameState.phase === 'territory_selection'}
						<p class="text-lg font-semibold text-blue-600 mt-2">
							<i class="fas fa-crosshairs mr-2"></i>
							{$gameState.players[$gameState.currentPlayerIndex]?.name || 'Player'}'s turn to attack!
						</p>
					{:else if $gameState.phase === 'duel' && $gameState.currentDuel}
						<p class="text-lg font-semibold text-red-600 mt-2">
							<i class="fas fa-sword mr-2"></i>
							Duel: {$gameState.players.find(p => p.id === $gameState.currentDuel?.attackerId)?.name || 'Player'} vs 
							{$gameState.players.find(p => p.id === $gameState.currentDuel?.defenderId)?.name || 'Player'}
						</p>
					{/if}
				</div>

			<div class="mb-6">
				<h3 class="text-lg font-semibold text-biblical-brown mb-3">Players ({$gameState.players.length}/3)</h3>
				{#each $gameState.players as player}
					<div class="flex justify-between items-center p-3 mb-2 bg-white rounded-lg border 
						{$gameState.phase === 'waiting' ? (player.isReady ? 'border-green-400 bg-green-50' : 'border-gray-300') : 
						 $gameState.currentPlayerIndex !== undefined && $gameState.players[$gameState.currentPlayerIndex]?.id === player.id ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}">
						<span class="font-medium">
							<i class="fas {player.id.startsWith('ai_') ? 'fa-robot text-blue-600' : 'fa-user'} mr-2"></i>
							{player.name}
							{#if player.id.startsWith('ai_')}
								<span class="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded ml-2">AI</span>
							{/if}
							{#if $gameState.phase === 'waiting'}
								{#if player.isReady}
									<i class="fas fa-check-circle text-green-600 ml-2"></i>
								{:else}
									<i class="fas fa-clock text-yellow-600 ml-2"></i>
								{/if}
							{:else if $gameState.currentPlayerIndex !== undefined && $gameState.players[$gameState.currentPlayerIndex]?.id === player.id}
								<i class="fas fa-crosshairs text-blue-600 ml-2"></i>
							{/if}
						</span>
						<div class="text-right">
							<div class="text-sm text-biblical-brown">
								<i class="fas fa-trophy mr-1"></i>{$gameState.scores[player.id] || 0} pts
							</div>
							<div class="text-xs text-gray-600">
								<i class="fas fa-map mr-1"></i>{player.territories?.length || 0} lands
							</div>
						</div>
					</div>
				{/each}
			</div>

			{#if $gameState.phase === 'waiting'}
				<div class="text-center">
					<p class="mb-4 text-amber-700">
						<i class="fas fa-hourglass-half mr-2"></i>Waiting for all players to be ready...
					</p>
					<div class="space-y-2">
						<button onclick={readyUp} class="btn-biblical">
							<i class="fas fa-shield-alt mr-2"></i>Ready Up!
						</button>
						{#if $gameState.players.length < 3}
							<button onclick={addAIPlayer} class="btn-biblical bg-blue-600 hover:bg-blue-700">
								<i class="fas fa-robot mr-2"></i>Add AI Player
							</button>
							<div class="text-sm text-gray-600 mt-2">
								<i class="fas fa-info-circle mr-1"></i>Room has {$gameState.players.length}/3 players
							</div>
						{/if}
					</div>
				</div>

			{:else if $gameState.phase === 'territory_selection'}
				{@const currentPlayer = $gameState.players[$gameState.currentPlayerIndex]}
				{@const myPlayer = $gameState.players.find(p => !p.id.startsWith('ai_'))}
				{@const isMyTurn = currentPlayer && myPlayer && currentPlayer.id === myPlayer.id}
				{@const attackableTerritories = isMyTurn ? getAttackableTerritories($gameState, myPlayer.id) : []}
				
				<div class="text-center">
					<Timer 
						duration={$gameState.timeRemaining} 
						size="large"
						onTimeUp={() => console.log('Selection time up!')}
					/>
					
					<div class="mt-6">
						{#if isMyTurn}
							<h3 class="text-xl font-semibold text-red-600 mb-4">
								<i class="fas fa-crosshairs mr-2"></i>Choose a territory to attack!
							</h3>
							<p class="text-sm text-gray-600 mb-4">
								Click on a highlighted territory on the map to attack it
							</p>
							
							<!-- Territory Feedback -->
							{#if territoryFeedback}
								<div class="mb-4 p-3 rounded-lg border-2 transition-all duration-300 {
									territoryFeedback.type === 'success' ? 'bg-green-50 border-green-300 text-green-800' :
									territoryFeedback.type === 'error' ? 'bg-red-50 border-red-300 text-red-800' :
									'bg-blue-50 border-blue-300 text-blue-800'
								}">
									<div class="flex items-center justify-center gap-2">
										<i class="fas {
											territoryFeedback.type === 'success' ? 'fa-check-circle' :
											territoryFeedback.type === 'error' ? 'fa-exclamation-triangle' :
											'fa-info-circle'
										}"></i>
										<span class="font-medium">{territoryFeedback.message}</span>
									</div>
								</div>
							{/if}
							
							{#if attackableTerritories.length === 0}
								<div class="text-amber-600 bg-amber-50 p-4 rounded-lg mb-4">
									<i class="fas fa-exclamation-triangle mr-2"></i>
									No adjacent enemy territories to attack. Your turn will be skipped.
								</div>
							{:else}
								<div class="text-green-600 bg-green-50 p-3 rounded-lg mb-4">
									<i class="fas fa-info-circle mr-2"></i>
									{attackableTerritories.length} territory{attackableTerritories.length > 1 ? 'ies' : 'y'} available to attack
								</div>
							{/if}
						{:else}
							<h3 class="text-xl font-semibold text-amber-800 mb-4">
								<i class="fas fa-clock mr-2"></i>Waiting for {currentPlayer?.name} to select a territory...
							</h3>
						{/if}
					</div>
				</div>

			{:else if $gameState.phase === 'duel' && $gameState.currentDuel}
				{@const attacker = $gameState.players.find(p => p.id === $gameState.currentDuel?.attackerId)}
				{@const defender = $gameState.players.find(p => p.id === $gameState.currentDuel?.defenderId)}
				
				<!-- Simplified duel notification - main interaction happens in modal -->
				<div class="text-center">
					<div class="mb-6 p-6 bg-red-50 border-2 border-red-300 rounded-lg">
						<h3 class="text-2xl font-bold text-red-800 mb-3">
							<i class="fas fa-sword mr-3"></i>
							{$gameState.currentDuel.tiebreaker ? 'TIEBREAKER IN PROGRESS!' : 'BATTLE IN PROGRESS!'}
						</h3>
						<div class="text-center mb-4">
							<div class="inline-block bg-amber-100 text-amber-800 px-4 py-2 rounded-full font-semibold">
								<i class="fas fa-map-marker-alt mr-2"></i>
								{$gameState.currentDuel.defenderTerritory?.charAt(0).toUpperCase() + $gameState.currentDuel.defenderTerritory?.slice(1)}
							</div>
						</div>
						<div class="flex items-center justify-center gap-6">
							<div class="text-center bg-white bg-opacity-50 rounded-lg p-3">
								<div class="font-bold text-lg">{attacker?.name}</div>
								<div class="text-sm text-red-600">Attacker</div>
							</div>
							<div class="text-4xl">⚔️</div>
							<div class="text-center bg-white bg-opacity-50 rounded-lg p-3">
								<div class="font-bold text-lg">{defender?.name}</div>
								<div class="text-sm text-blue-600">Defender</div>
							</div>
						</div>
						
						<!-- Answer Progress -->
						<div class="flex justify-center gap-6 mt-4">
							<div class="flex items-center gap-2">
								<div class="w-4 h-4 rounded-full {$gameState.playerAnswers?.[$gameState.currentDuel.attackerId] ? 'bg-green-500' : 'bg-gray-300'}"></div>
								<span class="text-sm">{attacker?.name}</span>
							</div>
							<div class="flex items-center gap-2">
								<div class="w-4 h-4 rounded-full {$gameState.playerAnswers?.[$gameState.currentDuel.defenderId] ? 'bg-green-500' : 'bg-gray-300'}"></div>
								<span class="text-sm">{defender?.name}</span>
							</div>
						</div>
					</div>
					
					<div class="text-gray-600">
						<i class="fas fa-info-circle mr-2"></i>
						{#if isDuelModalOpen}
							Answer the question in the modal above to participate in this duel!
						{:else}
							Duel interaction will appear when needed
						{/if}
					</div>
				</div>

			{:else if $gameState.phase === 'results' && $gameState.currentDuel?.result}
			{@const result = $gameState.currentDuel.result}
			{@const attacker = $gameState.players.find(p => p.id === $gameState.currentDuel?.attackerId)}
			{@const defender = $gameState.players.find(p => p.id === $gameState.currentDuel?.defenderId)}
			
			<div class="text-center">
				<div class="mb-6 p-6 bg-gradient-to-r from-blue-50 to-red-50 border-2 border-amber-400 rounded-xl">
					<h3 class="text-2xl font-bold text-amber-800 mb-4">
						<i class="fas fa-trophy mr-2"></i>Duel Results
					</h3>
					
					<!-- Winner announcement -->
					<div class="mb-4 p-4 bg-white rounded-lg border-2 border-green-400">
						<div class="text-xl font-bold text-green-700">
							🏆 {$gameState.players.find(p => p.id === result.winner)?.name} Wins!
						</div>
						{#if result.resolutionDetails?.winReason}
							<div class="text-sm text-gray-600 mt-2">{result.resolutionDetails.winReason}</div>
						{/if}
					</div>

					<!-- Answer details -->
					<div class="grid grid-cols-2 gap-4 mb-4">
						<div class="p-3 bg-red-50 rounded-lg border border-red-200">
							<div class="font-semibold text-red-800">{attacker?.name} (Attacker)</div>
							<div class="text-sm">
								Answer: <span class="font-mono">{result.resolutionDetails?.attackerAnswer}</span>
								{#if result.resolutionDetails?.questionType === 'multiple_choice'}
									{#if result.resolutionDetails?.attackerCorrect}
										<i class="fas fa-check text-green-600 ml-1"></i>
									{:else}
										<i class="fas fa-times text-red-600 ml-1"></i>
									{/if}
								{:else if result.resolutionDetails?.attackerDiff !== undefined}
									<div class="text-xs text-gray-600">
										Off by: {result.resolutionDetails.attackerDiff}
									</div>
								{/if}
								{#if result.resolutionDetails?.attackerTime && result.resolutionDetails.attackerTime !== 'No answer'}
									<div class="text-xs text-gray-500 mt-1">
										<i class="fas fa-clock mr-1"></i>Time: {result.resolutionDetails.attackerTime}s
									</div>
								{/if}
							</div>
						</div>
						
						<div class="p-3 bg-blue-50 rounded-lg border border-blue-200">
							<div class="font-semibold text-blue-800">{defender?.name} (Defender)</div>
							<div class="text-sm">
								Answer: <span class="font-mono">{result.resolutionDetails?.defenderAnswer}</span>
								{#if result.resolutionDetails?.questionType === 'multiple_choice'}
									{#if result.resolutionDetails?.defenderCorrect}
										<i class="fas fa-check text-green-600 ml-1"></i>
									{:else}
										<i class="fas fa-times text-red-600 ml-1"></i>
									{/if}
								{:else if result.resolutionDetails?.defenderDiff !== undefined}
									<div class="text-xs text-gray-600">
										Off by: {result.resolutionDetails.defenderDiff}
									</div>
								{/if}
								{#if result.resolutionDetails?.defenderTime && result.resolutionDetails.defenderTime !== 'No answer'}
									<div class="text-xs text-gray-500 mt-1">
										<i class="fas fa-clock mr-1"></i>Time: {result.resolutionDetails.defenderTime}s
									</div>
								{/if}
							</div>
						</div>
					</div>

					<!-- Correct answer -->
					<div class="p-3 bg-green-50 rounded-lg border border-green-200 mb-4">
						<div class="font-semibold text-green-800">
							Correct Answer: <span class="font-mono">{result.resolutionDetails?.correctAnswer}</span>
						</div>
					</div>

					<!-- Territory result -->
					{#if result.territoryConquered}
						<div class="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
							<div class="font-semibold text-yellow-800">
								<i class="fas fa-flag mr-2"></i>
								{result.territoryConquered.charAt(0).toUpperCase() + result.territoryConquered.slice(1)} 
								has been conquered!
							</div>
						</div>
					{:else}
						<div class="p-3 bg-gray-50 rounded-lg border border-gray-200">
							<div class="font-semibold text-gray-700">
								<i class="fas fa-shield-alt mr-2"></i>
								Territory successfully defended
							</div>
						</div>
					{/if}

					<!-- Timer -->
					<div class="mt-4">
						<Timer 
							duration={$gameState.timeRemaining} 
							size="small"
							onTimeUp={() => console.log('Results time up!')}
						/>
						<div class="text-xs text-gray-500 mt-1">Next turn starting...</div>
					</div>
				</div>
			</div>

		{:else if $gameState.phase === 'finished'}
				<div class="text-center">
					<h3 class="text-3xl font-bold text-amber-800 mb-6">
						<i class="fas fa-crown mr-3"></i>Game Over!<i class="fas fa-crown ml-3"></i>
					</h3>
					
					<div class="space-y-3 max-w-md mx-auto">
						{#each $gameState.players.sort((a, b) => a.rank - b.rank) as player, index}
							<div class="flex justify-between items-center p-4 bg-white rounded-lg border-2 
								{index === 0 ? 'border-yellow-400 bg-yellow-50' : 
								 index === 1 ? 'border-gray-400 bg-gray-50' : 
								 index === 2 ? 'border-amber-600 bg-amber-50' : 'border-gray-300'}">
								
								<div class="flex items-center">
									<div class="text-2xl mr-3">
										{#if index === 0}👑
										{:else if index === 1}🥈
										{:else if index === 2}🥉
										{:else}{index + 1}
										{/if}
									</div>
									<div>
										<div class="font-bold">{player.name}</div>
										<div class="text-xs text-gray-600">
											{player.territories?.length || 0} territories | {$gameState.scores[player.id] || 0} points
										</div>
									</div>
								</div>
								
								<div class="w-6 h-6 rounded-full {player.color === 'blue' ? 'bg-blue-500' : player.color === 'red' ? 'bg-red-500' : 'bg-yellow-500'}"></div>
							</div>
						{/each}
					</div>
				</div>
			{/if}
			</div>
			
			<!-- Map Panel -->
			<div class="space-y-4">
				<div class="card-biblical">
					{#if $gameState}
						{@const currentPlayer = $gameState.players[$gameState.currentPlayerIndex]}
						{@const myPlayer = $gameState.players.find(p => !p.id.startsWith('ai_'))}
						{@const isMyTurn = currentPlayer && myPlayer && currentPlayer.id === myPlayer.id}
						{@const attackableTerritories = isMyTurn ? getAttackableTerritories($gameState, myPlayer.id) : []}
						
						<CanaanMap 
							gameState={$gameState} 
							onterritoryClick={handleTerritoryClick}
							attackableTerritories={attackableTerritories}
							isMyTurn={isMyTurn}
							showAttackableHighlight={$gameState.phase === 'territory_selection'}
						/>
					{/if}
				</div>
			</div>
		</div>
	{/if}

	<!-- Duel Modal -->
	<DuelModal 
		gameState={$gameState}
		isOpen={isDuelModalOpen}
		onClose={() => isDuelModalOpen = false}
		onSubmitAnswer={submitDuelAnswer}
		hasSubmittedAnswer={hasSubmittedAnswer}
		selectedAnswerIndex={selectedAnswerIndex}
		textAnswer={textAnswer}
		numericalInput={numericalInput}
	/>

	<!-- Debug Panel - Always visible for debugging -->
	<div class="fixed bottom-4 right-4 w-96 z-50">
		<DebugPanel gameState={$gameState} />
	</div>
</div>

