<script lang="ts">
	interface Props {
		duration: number;
		onTimeUp?: () => void;
		onTick?: (remaining: number) => void;
		autoStart?: boolean;
		size?: 'small' | 'medium' | 'large';
	}

	let { duration = 30, onTimeUp, onTick, autoStart = true, size = 'medium' }: Props = $props();

	let timeRemaining = $state(duration);
	let isRunning = $state(autoStart);
	let intervalId: number | null = null;

	function start() {
		if (intervalId) return;
		isRunning = true;
		timeRemaining = duration;
		
		intervalId = setInterval(() => {
			timeRemaining--;
			onTick?.(timeRemaining);
			
			if (timeRemaining <= 0) {
				stop();
				onTimeUp?.();
			}
		}, 1000);
	}

	function stop() {
		if (intervalId) {
			clearInterval(intervalId);
			intervalId = null;
		}
		isRunning = false;
	}

	function reset() {
		stop();
		timeRemaining = duration;
	}

	function getProgress() {
		return ((duration - timeRemaining) / duration) * 100;
	}

	function getColorClass() {
		if (timeRemaining <= 5) return 'danger';
		if (timeRemaining <= 10) return 'warning';
		return 'normal';
	}

	$effect(() => {
		if (autoStart) {
			start();
		}
		return () => stop();
	});
</script>

<div class="timer timer-{size} {getColorClass()}">
	<div class="timer-circle">
		<svg class="timer-progress" viewBox="0 0 100 100">
			<circle
				cx="50"
				cy="50"
				r="45"
				fill="none"
				stroke="currentColor"
				stroke-width="4"
				opacity="0.2"
			/>
			<circle
				cx="50"
				cy="50"
				r="45"
				fill="none"
				stroke="currentColor"
				stroke-width="4"
				stroke-linecap="round"
				stroke-dasharray="283"
				stroke-dashoffset={283 - (getProgress() / 100) * 283}
				transform="rotate(-90 50 50)"
				style="transition: stroke-dashoffset 0.5s ease"
			/>
		</svg>
		<div class="timer-text">
			{timeRemaining}
		</div>
	</div>
	
	<div class="timer-controls">
		{#if !isRunning}
			<button onclick={start} class="btn-start">Start</button>
		{:else}
			<button onclick={stop} class="btn-stop">Stop</button>
		{/if}
		<button onclick={reset} class="btn-reset">Reset</button>
	</div>
</div>

<style>
	.timer {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		font-family: 'Arial', sans-serif;
	}

	.timer-circle {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.timer-progress {
		width: 100%;
		height: 100%;
	}

	.timer-small .timer-progress {
		width: 60px;
		height: 60px;
	}

	.timer-medium .timer-progress {
		width: 100px;
		height: 100px;
	}

	.timer-large .timer-progress {
		width: 150px;
		height: 150px;
	}

	.timer-text {
		position: absolute;
		font-weight: bold;
		color: inherit;
	}

	.timer-small .timer-text {
		font-size: 1rem;
	}

	.timer-medium .timer-text {
		font-size: 1.5rem;
	}

	.timer-large .timer-text {
		font-size: 2rem;
	}

	.timer-controls {
		display: flex;
		gap: 0.5rem;
	}

	.timer-controls button {
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.875rem;
		transition: background-color 0.2s;
	}

	.btn-start {
		background-color: #10b981;
		color: white;
	}

	.btn-start:hover {
		background-color: #059669;
	}

	.btn-stop {
		background-color: #ef4444;
		color: white;
	}

	.btn-stop:hover {
		background-color: #dc2626;
	}

	.btn-reset {
		background-color: #6b7280;
		color: white;
	}

	.btn-reset:hover {
		background-color: #4b5563;
	}

	.normal {
		color: #10b981;
	}

	.warning {
		color: #f59e0b;
	}

	.danger {
		color: #ef4444;
		animation: pulse 1s infinite;
	}

	@keyframes pulse {
		0%, 100% {
			opacity: 1;
		}
		50% {
			opacity: 0.7;
		}
	}
</style>