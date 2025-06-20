<script lang="ts">
	import { writable } from 'svelte/store';
	import { setDebugLogger } from '$lib/vercel-socket';
	import type { GameState } from '$lib/vercel-socket';

	interface Props {
		gameState: GameState | null;
	}

	interface LogEntry {
		timestamp: string;
		level: 'info' | 'warn' | 'error' | 'debug';
		message: string;
		data?: any;
	}

	let { gameState }: Props = $props();

	// Debug log store
	export const debugLogs = writable<LogEntry[]>([]);
	let logs: LogEntry[] = $state([]);
	let isExpanded = $state(false);
	let autoScroll = $state(true);
	let logContainer: HTMLDivElement | undefined = undefined;

	// Subscribe to logs
	debugLogs.subscribe(value => {
		logs = value;
		if (autoScroll && logContainer) {
			setTimeout(() => {
				logContainer.scrollTop = logContainer.scrollHeight;
			}, 10);
		}
	});

	// Set up debug logger on component mount
	setDebugLogger(addLog);

	// Add log entry function (can be called from anywhere)
	export function addLog(level: 'info' | 'warn' | 'error' | 'debug', message: string, data?: any) {
		const entry: LogEntry = {
			timestamp: new Date().toISOString().split('T')[1].slice(0, -1), // Just time part
			level,
			message,
			data: data ? JSON.stringify(data, null, 2) : undefined
		};
		
		debugLogs.update(logs => {
			const newLogs = [...logs, entry];
			// Keep only last 100 entries to prevent memory issues
			return newLogs.slice(-100);
		});
	}

	// Log game state changes
	$effect(() => {
		if (gameState) {
			addLog('info', `Game state updated - Phase: ${gameState.phase}`, {
				round: gameState.round,
				turn: gameState.turn,
				currentPlayer: gameState.players[gameState.currentPlayerIndex]?.name,
				territories: Object.keys(gameState.territories || {}).length
			});
		}
	});

	function clearLogs() {
		debugLogs.set([]);
	}

	async function copyLogsToClipboard() {
		const logText = logs.map(log => {
			const dataStr = log.data ? `\nData: ${log.data}` : '';
			return `[${log.timestamp}] ${log.level.toUpperCase()}: ${log.message}${dataStr}`;
		}).join('\n\n');

		try {
			await navigator.clipboard.writeText(logText);
			addLog('info', 'Logs copied to clipboard');
		} catch (err) {
			addLog('error', 'Failed to copy logs to clipboard', err);
		}
	}

	function getLogColor(level: string) {
		switch (level) {
			case 'error': return 'text-red-600 bg-red-50';
			case 'warn': return 'text-yellow-600 bg-yellow-50';
			case 'debug': return 'text-purple-600 bg-purple-50';
			default: return 'text-blue-600 bg-blue-50';
		}
	}

	function exportGameState() {
		if (gameState) {
			const stateJson = JSON.stringify(gameState, null, 2);
			const blob = new Blob([stateJson], { type: 'application/json' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `bibliostador-state-${new Date().toISOString()}.json`;
			a.click();
			URL.revokeObjectURL(url);
			addLog('info', 'Game state exported to file');
		}
	}
</script>

<div class="debug-panel bg-gray-900 text-gray-100 rounded-lg border-2 border-gray-700">
	<!-- Debug Panel Header -->
	<div class="flex items-center justify-between p-3 bg-gray-800 rounded-t-lg border-b border-gray-700">
		<button 
			onclick={() => isExpanded = !isExpanded}
			class="flex items-center gap-2 text-sm font-semibold text-green-400 hover:text-green-300 transition-colors"
		>
			<i class="fas {isExpanded ? 'fa-chevron-down' : 'fa-chevron-right'}"></i>
			<i class="fas fa-bug"></i>
			Debug Panel ({logs.length})
		</button>
		
		{#if isExpanded}
			<div class="flex gap-2">
				<button 
					onclick={exportGameState}
					class="px-2 py-1 text-xs bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors"
					disabled={!gameState}
					title="Export current game state"
				>
					<i class="fas fa-download mr-1"></i>Export
				</button>
				<button 
					onclick={copyLogsToClipboard}
					class="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
					title="Copy logs to clipboard"
				>
					<i class="fas fa-copy mr-1"></i>Copy
				</button>
				<button 
					onclick={clearLogs}
					class="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
					title="Clear all logs"
				>
					<i class="fas fa-trash mr-1"></i>Clear
				</button>
			</div>
		{/if}
	</div>

	{#if isExpanded}
		<!-- Debug Panel Content -->
		<div class="p-3">
			<!-- Game State Summary -->
			{#if gameState}
				<div class="mb-3 p-2 bg-gray-800 rounded text-xs">
					<div class="grid grid-cols-2 gap-2">
						<div><span class="text-gray-400">Room:</span> {gameState.id}</div>
						<div><span class="text-gray-400">Phase:</span> {gameState.phase}</div>
						<div><span class="text-gray-400">Round:</span> {gameState.round}/{gameState.gameSettings?.maxRounds || 6}</div>
						<div><span class="text-gray-400">Turn:</span> {gameState.turn}/{gameState.gameSettings?.turnsPerPlayerPerRound || 3}</div>
						<div><span class="text-gray-400">Players:</span> {gameState.players.length}</div>
						<div><span class="text-gray-400">Territories:</span> {Object.keys(gameState.territories || {}).length}</div>
					</div>
				</div>
			{/if}

			<!-- Auto-scroll toggle -->
			<div class="mb-2 flex items-center gap-2">
				<label class="flex items-center gap-1 text-xs text-gray-400">
					<input 
						type="checkbox" 
						bind:checked={autoScroll}
						class="w-3 h-3"
					/>
					Auto-scroll
				</label>
			</div>

			<!-- Log Container -->
			<div 
				bind:this={logContainer}
				class="log-container bg-black rounded p-2 h-40 overflow-y-auto text-xs font-mono"
			>
				{#if logs.length === 0}
					<div class="text-gray-500 italic">No logs yet...</div>
				{:else}
					{#each logs as log}
						<div class="log-entry mb-1 p-1 rounded {getLogColor(log.level)}">
							<div class="flex items-start gap-2">
								<span class="text-xs text-gray-500 font-mono">{log.timestamp}</span>
								<span class="text-xs font-semibold uppercase">[{log.level}]</span>
								<span class="flex-1">{log.message}</span>
							</div>
							{#if log.data}
								<pre class="mt-1 text-xs text-gray-600 bg-gray-100 p-1 rounded overflow-x-auto">{log.data}</pre>
							{/if}
						</div>
					{/each}
				{/if}
			</div>
		</div>
	{/if}
</div>

<style>
	.log-container::-webkit-scrollbar {
		width: 8px;
	}
	
	.log-container::-webkit-scrollbar-track {
		background: #374151;
		border-radius: 4px;
	}
	
	.log-container::-webkit-scrollbar-thumb {
		background: #6B7280;
		border-radius: 4px;
	}
	
	.log-container::-webkit-scrollbar-thumb:hover {
		background: #9CA3AF;
	}
</style>