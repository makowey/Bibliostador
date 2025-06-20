<script lang="ts">
	import { onMount } from 'svelte';
	import Timer from '$lib/components/Timer.svelte';
	import CanaanMap from '$lib/components/CanaanMap.svelte';
	import TurnProgressDisplay from '$lib/components/TurnProgressDisplay.svelte';
	import DebugPanel from '$lib/components/DebugPanel.svelte';
	// Smart socket: WebSocket for local development, Vercel HTTP for production
	import { socketService, gameState, isConnected } from '$lib/smart-socket.js';

	let playerName = $state('');
	let roomId = $state('');
	let aiPlayerCount = $state(2); // Default to 2 AI players
	let myPlayerId = $state('');
	let numericalInput: HTMLInputElement | undefined = undefined;
	let lastGamePhase = $state('');
	let hasSubmittedAnswer = $state(false);

	onMount(() => {
		socketService.connect();
	});

	// Handle phase changes and timer expiry for auto-submit
	$effect(() => {
		if ($gameState?.phase !== lastGamePhase) {
			lastGamePhase = $gameState?.phase || '';
			hasSubmittedAnswer = false; // Reset on phase change
		}

		// Auto-submit numerical answer when timer expires
		if ($gameState?.phase === 'duel' && 
			$gameState?.timeRemaining === 0 && 
			$gameState?.currentQuestion?.type === 'numerical' && 
			!hasSubmittedAnswer &&
			numericalInput?.value) {
			
			const myPlayer = $gameState.players.find(p => !p.id.startsWith('ai_'));
			const isParticipant = myPlayer && ($gameState.currentDuel?.attackerId === myPlayer.id || $gameState.currentDuel?.defenderId === myPlayer.id);
			
			if (isParticipant) {
				console.log('Auto-submitting numerical answer on timer expiry:', numericalInput.value);
				submitDuelAnswer(parseInt(numericalInput.value));
				hasSubmittedAnswer = true;
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
		hasSubmittedAnswer = true;
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
			
			if (isMyTurn) {
				const attackableTerritories = getAttackableTerritories($gameState, myPlayer.id);
				console.log('Attackable territories:', attackableTerritories);
				
				if (attackableTerritories.includes(territoryId)) {
					console.log('Attacking territory:', territoryId);
					selectTerritory(territoryId);
				} else {
					console.log('Territory not attackable:', territoryId);
				}
			}
		}
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

			{:else if $gameState.phase === 'duel' && $gameState.currentQuestion && $gameState.currentDuel}
				{@const myPlayer = $gameState.players.find(p => !p.id.startsWith('ai_'))}
				{@const isParticipant = myPlayer && ($gameState.currentDuel.attackerId === myPlayer.id || $gameState.currentDuel.defenderId === myPlayer.id)}
				{@const attacker = $gameState.players.find(p => p.id === $gameState.currentDuel.attackerId)}
				{@const defender = $gameState.players.find(p => p.id === $gameState.currentDuel.defenderId)}
				
				<div class="text-center">
					<div class="mb-4 p-4 bg-red-50 border-2 border-red-300 rounded-lg">
						<h3 class="text-lg font-bold text-red-800 mb-2">
							<i class="fas fa-sword mr-2"></i>
							{$gameState.currentDuel.tiebreaker ? 'TIEBREAKER DUEL!' : 'BATTLE FOR TERRITORY!'}
						</h3>
						<div class="text-center mb-3">
							<div class="inline-block bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-semibold">
								<i class="fas fa-map-marker-alt mr-1"></i>
								{$gameState.currentDuel.defenderTerritory?.charAt(0).toUpperCase() + $gameState.currentDuel.defenderTerritory?.slice(1)}
							</div>
						</div>
						<div class="flex items-center justify-center gap-4">
							<div class="text-center">
								<div class="text-sm font-medium">{attacker?.name}</div>
								<div class="text-xs text-gray-600">Attacker</div>
							</div>
							<i class="fas fa-sword text-red-600 text-2xl"></i>
							<div class="text-center">
								<div class="text-sm font-medium">{defender?.name}</div>
								<div class="text-xs text-gray-600">Defender</div>
							</div>
						</div>
					</div>

					<Timer 
						duration={$gameState.timeRemaining} 
						size="large"
						onTimeUp={() => console.log('Duel time up!')}
					/>
					
					<div class="mt-6">
						<h3 class="text-xl font-semibold text-biblical-brown mb-4">{$gameState.currentQuestion.text}</h3>
						
						{#if isParticipant}
							{#if $gameState.currentQuestion.type === 'multiple_choice'}
								<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
									{#each $gameState.currentQuestion.options as option, index}
										<button 
											class="p-4 bg-white text-biblical-brown border-2 border-biblical-gold rounded-lg hover:bg-biblical-gold hover:text-white transition-all duration-200 font-medium"
											onclick={() => submitDuelAnswer(index)}
											disabled={hasSubmittedAnswer}
										>
											{option}
										</button>
									{/each}
								</div>
							{:else if $gameState.currentQuestion.type === 'numerical'}
								<div class="max-w-xs mx-auto">
									<input 
										bind:this={numericalInput}
										type="number" 
										placeholder="Enter your answer" 
										class="input-biblical text-center text-lg w-full"
										onkeydown={(e) => {
											if (e.key === 'Enter' && !hasSubmittedAnswer) {
												const input = e.target as HTMLInputElement;
												if (input.value) {
													submitDuelAnswer(parseInt(input.value));
												}
											}
										}}
									/>
									<button 
										class="btn-biblical w-full mt-2"
										onclick={(e) => {
											if (!hasSubmittedAnswer) {
												const input = e.target.parentElement.querySelector('input') as HTMLInputElement;
												if (input.value) {
													submitDuelAnswer(parseInt(input.value));
												}
											}
										}}
										disabled={hasSubmittedAnswer}
									>
										Submit Answer
									</button>
								</div>
							{/if}
						{:else}
							<!-- Spectator View -->
							<div class="text-gray-600 mb-4">
								<i class="fas fa-eye mr-2"></i>Spectating this duel...
							</div>
							
							{#if $gameState.currentQuestion.type === 'multiple_choice'}
								<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
									{#each $gameState.currentQuestion.options as option, index}
										<div class="p-4 bg-gray-100 text-gray-700 border-2 border-gray-300 rounded-lg font-medium relative">
											{option}
											
											<!-- Show who answered what -->
											<div class="absolute top-1 right-1 flex gap-1">
												{#if $gameState.playerAnswers?.[$gameState.currentDuel.attackerId]?.answer === index}
													<div class="w-3 h-3 rounded-full bg-red-500" title="{attacker?.name} chose this"></div>
												{/if}
												{#if $gameState.playerAnswers?.[$gameState.currentDuel.defenderId]?.answer === index}
													<div class="w-3 h-3 rounded-full bg-blue-500" title="{defender?.name} chose this"></div>
												{/if}
											</div>
										</div>
									{/each}
								</div>
							{:else if $gameState.currentQuestion.type === 'numerical'}
								<div class="max-w-md mx-auto text-center">
									<div class="bg-gray-100 p-4 rounded-lg mb-4">
										<p class="text-gray-600">Numerical answer required</p>
									</div>
									
									<!-- Show submitted answers -->
									{#if $gameState.playerAnswers}
										<div class="space-y-2">
											{#if $gameState.playerAnswers[$gameState.currentDuel.attackerId]}
												<div class="bg-red-50 text-red-800 p-2 rounded">
													{attacker?.name}: {$gameState.playerAnswers[$gameState.currentDuel.attackerId].answer}
												</div>
											{/if}
											{#if $gameState.playerAnswers[$gameState.currentDuel.defenderId]}
												<div class="bg-blue-50 text-blue-800 p-2 rounded">
													{defender?.name}: {$gameState.playerAnswers[$gameState.currentDuel.defenderId].answer}
												</div>
											{/if}
										</div>
									{/if}
								</div>
							{/if}
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

	<!-- Debug Panel - Always visible for debugging -->
	<div class="fixed bottom-4 right-4 w-96 z-50">
		<DebugPanel gameState={$gameState} />
	</div>
</div>

