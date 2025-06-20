<script lang="ts">
	import Timer from './Timer.svelte';
	import type { GameState, Player } from '$lib/smart-socket';

	interface Props {
		gameState: GameState;
		isOpen: boolean;
		onClose?: () => void;
		onSubmitAnswer: (answer: number | string) => void;
		hasSubmittedAnswer: boolean;
		selectedAnswerIndex: number | null;
		textAnswer: string;
		numericalInput?: HTMLInputElement;
	}

	let { 
		gameState, 
		isOpen, 
		onClose, 
		onSubmitAnswer, 
		hasSubmittedAnswer,
		selectedAnswerIndex,
		textAnswer,
		numericalInput
	}: Props = $props();

	let modalElement: HTMLDivElement | undefined = undefined;

	// Auto-focus on first input when modal opens
	$effect(() => {
		if (isOpen && modalElement) {
			setTimeout(() => {
				const firstInput = modalElement.querySelector('input, button') as HTMLElement;
				firstInput?.focus();
			}, 100);
		}
	});

	// Close modal on Escape key
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && onClose) {
			onClose();
		}
	}

	// Prevent background scroll when modal is open
	$effect(() => {
		if (isOpen) {
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = '';
		}
		
		return () => {
			document.body.style.overflow = '';
		};
	});

	// Get current duel participants
	function getDuelParticipants() {
		if (!gameState?.currentDuel || !gameState?.players) return { attacker: null, defender: null };
		
		const attacker = gameState.players.find(p => p.id === gameState.currentDuel?.attackerId);
		const defender = gameState.players.find(p => p.id === gameState.currentDuel?.defenderId);
		
		return { attacker, defender };
	}

	// Check if current player is participating in duel
	function isParticipating(): boolean {
		const myPlayer = gameState?.players?.find(p => !p.id.startsWith('ai_'));
		return myPlayer && gameState?.currentDuel && 
			(gameState.currentDuel.attackerId === myPlayer.id || gameState.currentDuel.defenderId === myPlayer.id);
	}

	function submitAnswer(answer: number | string) {
		onSubmitAnswer(answer);
	}

	// Auto-submit when timer expires with any available input
	$effect(() => {
		if (isOpen && gameState?.timeRemaining === 0 && !hasSubmittedAnswer && isParticipating()) {
			let answerToSubmit = null;
			
			if (gameState.currentQuestion?.type === 'numerical' && numericalInput?.value?.trim()) {
				answerToSubmit = parseInt(numericalInput.value);
				console.log('Modal: Auto-submitting numerical answer on timer expiry:', answerToSubmit);
			} else if (gameState.currentQuestion?.type === 'text' && textAnswer?.trim()) {
				answerToSubmit = textAnswer.trim();
				console.log('Modal: Auto-submitting text answer on timer expiry:', answerToSubmit);
			}
			
			if (answerToSubmit !== null) {
				submitAnswer(answerToSubmit);
			}
		}
	});
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen && gameState?.currentQuestion && gameState?.currentDuel}
	{@const { attacker, defender } = getDuelParticipants()}
	{@const isUserParticipating = isParticipating()}
	
	<!-- Modal Backdrop -->
	<div 
		class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
		onclick={onClose}
	>
		<!-- Modal Content -->
		<div 
			bind:this={modalElement}
			class="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
			onclick={(e) => e.stopPropagation()}
		>
			<!-- Modal Header -->
			<div class="bg-gradient-to-r from-red-600 to-orange-600 text-white p-6 rounded-t-xl">
				<div class="flex items-center justify-between">
					<div class="flex items-center">
						<i class="fas fa-sword text-2xl mr-3"></i>
						<div>
							<h2 class="text-2xl font-bold">
								{gameState.currentDuel.tiebreaker ? 'TIEBREAKER DUEL!' : 'BATTLE FOR TERRITORY!'}
							</h2>
							<p class="text-red-100 text-sm">
								{gameState.currentDuel.defenderTerritory?.charAt(0).toUpperCase() + gameState.currentDuel.defenderTerritory?.slice(1)}
							</p>
						</div>
					</div>
					{#if onClose}
						<button 
							onclick={onClose}
							class="text-white hover:text-red-200 transition-colors p-1"
							aria-label="Close modal"
						>
							<i class="fas fa-times text-xl"></i>
						</button>
					{/if}
				</div>
				
				<!-- Duel Participants -->
				<div class="flex items-center justify-center gap-6 mt-4">
					<div class="text-center">
						<div class="bg-white bg-opacity-20 rounded-lg p-3">
							<div class="text-lg font-bold">{attacker?.name}</div>
							<div class="text-sm text-red-100">Attacker</div>
						</div>
					</div>
					<div class="text-3xl">⚔️</div>
					<div class="text-center">
						<div class="bg-white bg-opacity-20 rounded-lg p-3">
							<div class="text-lg font-bold">{defender?.name}</div>
							<div class="text-sm text-red-100">Defender</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Modal Body -->
			<div class="p-6">
				<!-- Timer - Large and Prominent -->
				<div class="text-center mb-6">
					<Timer 
						duration={gameState.timeRemaining} 
						size="large"
						onTimeUp={() => console.log('Duel time up!')}
					/>
				</div>

				<!-- Question -->
				<div class="bg-amber-50 border-2 border-amber-200 rounded-lg p-6 mb-6">
					<h3 class="text-xl font-bold text-amber-900 mb-4 text-center">
						{gameState.currentQuestion.text}
					</h3>

					{#if isUserParticipating}
						<!-- User Input Section -->
						{#if gameState.currentQuestion.type === 'multiple_choice'}
							<div class="grid grid-cols-1 gap-3">
								{#each gameState.currentQuestion.options as option, index}
									<button 
										class="p-4 border-2 rounded-lg font-medium transition-all duration-200 text-left
											{selectedAnswerIndex === index 
												? 'bg-amber-600 text-white border-amber-600 ring-2 ring-amber-300' 
												: 'bg-white text-amber-900 border-amber-300 hover:bg-amber-100 hover:border-amber-400'} 
											{hasSubmittedAnswer ? 'opacity-75 cursor-not-allowed' : 'cursor-pointer hover:scale-[1.02]'}"
										onclick={() => !hasSubmittedAnswer && submitAnswer(index)}
										disabled={hasSubmittedAnswer}
									>
										<div class="flex items-center justify-between">
											<span>{option}</span>
											{#if selectedAnswerIndex === index && hasSubmittedAnswer}
												<i class="fas fa-check text-white"></i>
											{/if}
										</div>
									</button>
								{/each}
							</div>

						{:else if gameState.currentQuestion.type === 'numerical'}
							<div class="max-w-sm mx-auto">
								<input 
									bind:this={numericalInput}
									type="number" 
									placeholder="Enter your answer" 
									class="w-full p-4 text-center text-xl border-2 border-amber-300 rounded-lg focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all
										{hasSubmittedAnswer ? 'bg-green-50 border-green-400 text-green-800' : 'bg-white'}"
									onkeydown={(e) => {
										if (e.key === 'Enter' && !hasSubmittedAnswer) {
											const input = e.target as HTMLInputElement;
											if (input.value) {
												submitAnswer(parseInt(input.value));
											}
										}
									}}
									disabled={hasSubmittedAnswer}
								/>
								{#if hasSubmittedAnswer}
									<div class="text-center text-green-600 mt-3">
										<i class="fas fa-check mr-2"></i>Answer submitted: {numericalInput?.value}
									</div>
								{:else}
									{#if gameState.timeRemaining <= 3 && numericalInput?.value?.trim()}
										<div class="text-center text-orange-600 mt-2 text-sm font-medium">
											<i class="fas fa-clock mr-1"></i>Will auto-submit when timer expires
										</div>
									{/if}
									<button 
										class="w-full mt-3 bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
										onclick={() => {
											if (!hasSubmittedAnswer && numericalInput?.value) {
												submitAnswer(parseInt(numericalInput.value));
											}
										}}
										disabled={hasSubmittedAnswer}
									>
										Submit Answer
									</button>
								{/if}
							</div>

						{:else if gameState.currentQuestion.type === 'text'}
							<div class="max-w-sm mx-auto">
								<input 
									bind:value={textAnswer}
									type="text" 
									placeholder="Enter your answer" 
									class="w-full p-4 text-center text-xl border-2 border-amber-300 rounded-lg focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all
										{hasSubmittedAnswer ? 'bg-green-50 border-green-400 text-green-800' : 'bg-white'}"
									onkeydown={(e) => {
										if (e.key === 'Enter' && !hasSubmittedAnswer) {
											const input = e.target as HTMLInputElement;
											if (input.value.trim()) {
												submitAnswer(input.value.trim());
											}
										}
									}}
									disabled={hasSubmittedAnswer}
								/>
								{#if hasSubmittedAnswer}
									<div class="text-center text-green-600 mt-3">
										<i class="fas fa-check mr-2"></i>Answer submitted: {textAnswer}
									</div>
								{:else}
									{#if gameState.timeRemaining <= 3 && textAnswer?.trim()}
										<div class="text-center text-orange-600 mt-2 text-sm font-medium">
											<i class="fas fa-clock mr-1"></i>Will auto-submit when timer expires
										</div>
									{/if}
									<button 
										class="w-full mt-3 bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
										onclick={() => {
											if (!hasSubmittedAnswer && textAnswer.trim()) {
												submitAnswer(textAnswer.trim());
											}
										}}
										disabled={hasSubmittedAnswer}
									>
										Submit Answer
									</button>
								{/if}
							</div>
						{/if}

						{#if hasSubmittedAnswer}
							<div class="mt-6 p-4 bg-green-50 border-2 border-green-200 rounded-lg text-center">
								<div class="text-green-800 font-semibold">
									<i class="fas fa-hourglass-half mr-2"></i>
									Waiting for opponent...
								</div>
							</div>
						{/if}

					{:else}
						<!-- Spectator View -->
						<div class="text-center">
							<div class="inline-flex items-center px-4 py-2 bg-gray-100 rounded-lg text-gray-700">
								<i class="fas fa-eye mr-2"></i>
								Spectating this duel...
							</div>
							
							<!-- Show submitted answers for spectators -->
							{#if gameState.playerAnswers}
								<div class="mt-6 space-y-3">
									{#if gameState.playerAnswers[gameState.currentDuel.attackerId]}
										<div class="bg-red-50 text-red-800 p-3 rounded-lg">
											<strong>{attacker?.name}:</strong> {gameState.playerAnswers[gameState.currentDuel.attackerId].answer}
										</div>
									{/if}
									{#if gameState.playerAnswers[gameState.currentDuel.defenderId]}
										<div class="bg-blue-50 text-blue-800 p-3 rounded-lg">
											<strong>{defender?.name}:</strong> {gameState.playerAnswers[gameState.currentDuel.defenderId].answer}
										</div>
									{/if}
								</div>
							{/if}
						</div>
					{/if}
				</div>

				<!-- Answer Status Indicator -->
				<div class="flex justify-center gap-4 text-sm">
					<div class="flex items-center gap-2">
						<div class="w-3 h-3 rounded-full {gameState.playerAnswers?.[gameState.currentDuel.attackerId] ? 'bg-green-500' : 'bg-gray-300'}"></div>
						<span>{attacker?.name}</span>
					</div>
					<div class="flex items-center gap-2">
						<div class="w-3 h-3 rounded-full {gameState.playerAnswers?.[gameState.currentDuel.defenderId] ? 'bg-green-500' : 'bg-gray-300'}"></div>
						<span>{defender?.name}</span>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	/* Smooth animations for modal */
	.fixed {
		animation: fadeIn 0.2s ease-out;
	}
	
	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}
	
	/* Enhanced focus styles */
	input:focus, button:focus {
		outline: none;
	}
</style>