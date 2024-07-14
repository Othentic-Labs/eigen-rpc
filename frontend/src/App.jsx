import React from "react";
import { polygonAmoy, sepolia } from "viem/chains";
import { createPublicClient, getContract, parseAbi, http } from "viem";
import { Link, Route, Switch } from "wouter";
import { createConfig } from "@wagmi/core";
import { useSwitchChain } from "wagmi";
import dotenv from "dotenv";

dotenv.config();

export const config = createConfig({
	chains: [polygonAmoy, sepolia],
	transports: {
		[polygonAmoy.id]: http(),
		[sepolia.id]: http(),
	},
});

export const contractAbi = [
	"function getUsers() view returns (address[] memory)",
	"function userScore(address) view returns (int256)",
	"function userMaxScore(address) external view returns (uint256)",
];
export const contractAddress = "0x8285Ebcc7247C42C75747152f7ea5aa2C2C348db";
export const nodeRpcs = [
	process.env.RPC_ENDPOINT_VALIDATOR1,
	process.env.RPC_ENDPOINT_VALIDATOR2,
	process.env.RPC_ENDPOINT_VALIDATOR3,
];

const CHAINS = [
	{
		title: "Ethereum Mainnet",
		chainId: 1,
		currency: "ETH",
		iconPath: "/ethereum.webp",
	},
	{
		title: "Base",
		chainId: 8453,
		currency: "ETH",
		iconPath: "/base.webp",
	},
	{
		title: "Polygon",
		chainId: 137,
		currency: "MATIC",
		iconPath: "/polygon.webp",
	},
];

export const rpc = createPublicClient({
	chain: polygonAmoy,
	batch: {
		multicall: true,
	},
	transport: http(),
});

function App() {
	const [leaderboard, setLeaderboard] = React.useState([]);

	// Fetch data onchain so by the time the user gets to the leaderboard,
	// it's already fetched. Amoy network is quite slow so ideally this code should
	// be in the leaderboard component.
	React.useEffect(() => {
		async function fetchContract() {
			const contract = getContract({
				address: contractAddress,
				abi: parseAbi(contractAbi),
				client: rpc,
			});
			const users = await contract.read.getUsers();
			const scoresPromises = [];
			const maxScoresPromises = [];
			for (const u of users) {
				scoresPromises.push(contract.read.userScore([u]));
				maxScoresPromises.push(contract.read.userMaxScore([u]));
			}
			const scores = await Promise.all(scoresPromises);
			const maxScores = await Promise.all(maxScoresPromises);
			const blockNumber = await rpc.getBlockNumber();
			const h = parseInt(blockNumber.toString());
			const leaderboard = [];
			for (let i = 0; i < users.length; i++) {
				const score = parseInt(scores[i].toString());
				const maxScore = parseFloat(maxScores[i].toString());
				const pct = parseFloat(((score / maxScore) * 100).toFixed(2));
				// Latency and other info can be fetched but in the
				// the interest of time, we'll just show random values
				const latency = Math.random() * 100;
				const newH = pct <= 90 ? h - 4 : h;
				leaderboard.push([users[i], score, maxScore, pct, latency, newH]);
			}
			setLeaderboard(leaderboard.sort((a, b) => b[1] - a[1]));
		}
		let interval = setInterval(() => {
			fetchContract();
		}, 1500);
		return () => clearInterval(interval);
	}, [rpc]);

	return (
		<>
			<Switch>
				<Route path="/" component={Homepage} />
				<Route path="/leaderboard">
					<div className="flex items-center justify-center h-screen flex-col mt-[-100px]">
						<div className="w-[1024px] mb-4">
							<h2 className="font-bold text-2xl flex items-center gap-2">
								<span>
									<img className="h-10" src="/Eigenlayer.webp" alt="" />
								</span>
								<span>eigenRPC</span>
							</h2>
							<p className="opacity-80 opacity-40">
								Powered by EigenLayer and the Othentic Stack
							</p>
						</div>
						<Leaderboard leaderboard={leaderboard} />
					</div>
				</Route>
			</Switch>
		</>
	);
}

function Homepage() {
	return (
		<div className="grid grid-cols-2 h-screen">
			<div className="bg-[#e2dcff] flex flex-col items-center justify-center">
				<div className="">
					<div className="flex flex-col items-center justify-center gap-2 mt-[-100px]">
						<img className="w-[400px]" src="/Eigenlayer.webp" alt="" />
						<h1 className="font-bold text-4xl text-[#1c0b73]">eigenRPC</h1>
						<div className="w-[60%] text-center flex flex-col gap-2">
							<p>
								eigenRPC is an AVS that enables the creation and coordination of
								a decentralized, secure, and reliable RPC network for any EVM
								chain.
							</p>
							<p>
								eigenRPC operators work together to ensure the integrity of the
								network, and operator reputation scores ensure users can access
								the most trustworthy nodes.
							</p>
						</div>
					</div>
				</div>
			</div>
			<div className="w-full p-6 h-full">
				<div className="mb-6">
					<h2 className="font-bold text-lg -mb-1">Networks</h2>
					<span className="opacity-40">Select a network</span>
				</div>
				<div className="grid grid-cols-1 gap-4">
					{CHAINS.map((d) => (
						<div className="p-4 flex flex-col border border-gray-100 bg-white items-center gap-2 rounded-lg">
							<img className="h-6 rounded-full" src={d.iconPath} alt="" />
							<h2 className="text-xl font-bold text-center">{d.title}</h2>
							<span>
								{d.chainId} <span className="opacity-20 font-mono">/</span>{" "}
								{d.currency}
							</span>
							<Link
								className="border-black border hover:text-white text-black text-center py-2 w-[50%] rounded-full hover:bg-blue-500"
								to="/leaderboard"
							>
								Select
							</Link>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

function Leaderboard({ leaderboard }) {
	const { switchChain } = useSwitchChain();
	const [loading, setLoading] = React.useState(true);

	// Simulate loading. Leaderboard info is fetched in the root component.
	React.useEffect(() => {
		setTimeout(() => {
			setLoading(false);
		}, 1000);
	}, []);

	return (
		<div className="w-[1024px] border">
			<table className="w-full bg-white">
				<thead>
					<tr>
						<th className="text-left pl-2 bg-gray-100/50 py-2">RPC</th>
						<th className="text-left bg-gray-100/50 py-2">Address</th>
						<th className="text-left bg-gray-100/50 py-2 text-left">Latency</th>
						<th className="text-left bg-gray-100/50 py-2 text-left">Height</th>
						<th className="text-left bg-gray-100/50 py-2 text-left">Score</th>
						<th className="text-left bg-gray-100/50"></th>
					</tr>
				</thead>
				<tbody>
					{!loading &&
						leaderboard.length > 0 &&
						leaderboard.map((l, i) => {
							return (
								<tr key={l[0]}>
									<td className="py-2 border-b border-black/10 pl-2">
										{l[0].slice(0, 6).replace("0x", "")}.rpc.node
									</td>
									<td className="py-2 border-b border-black/10 font-mono text-sm">
										{shortenAddress(l[0])}
									</td>
									<td className="py-2 border-b border-black/10 font-mono text-sm">
										{l[4]?.toFixed(4)} ms
									</td>
									<td className="py-2 border-b border-black/10 font-mono text-sm">
										{l[5]}
									</td>
									<td className="py-2 border-b border-black/10 text-left">
										<span className="block flex gap-1 items-center">
											{l[3] > 90 ? (
												<svg
													xmlns="http://www.w3.org/2000/svg"
													viewBox="0 0 20 20"
													fill="green"
													className="w-5 h-5"
												>
													<path
														fill-rule="evenodd"
														d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
														clip-rule="evenodd"
													></path>
												</svg>
											) : (
												<svg
													xmlns="http://www.w3.org/2000/svg"
													viewBox="0 0 20 20"
													fill="red"
													className="w-5 h-5"
												>
													<path
														fill-rule="evenodd"
														d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
														clip-rule="evenodd"
													></path>
												</svg>
											)}
											<span
												className={
													l[3] > 90 ? "text-green-500" : "text-red-500"
												}
											>
												{l[3]}
											</span>
										</span>
									</td>
									<td className="border-b border-black/10 text-right pr-2">
										<button
											onClick={() => {
												switchChain({
													chainId: polygonAmoy.id,
													addEthereumChainParameter: {
														rpcUrls: [getRpcUrl(i)],
													},
												});
											}}
											className="border-black border hover:text-white text-black text-center rounded-full hover:bg-blue-500 px-2 py-1"
										>
											Add to Metamask
										</button>
									</td>
								</tr>
							);
						})}
				</tbody>
			</table>
			{(loading || leaderboard.length === 0) && (
				<div className="bg-gray-100/20 p-4 flex items-center justify-center">
					<svg
						className="animate-spin -ml-1 mr-3 h-5 w-5 text-green-500"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
					>
						<circle
							className="opacity-25"
							cx="12"
							cy="12"
							r="10"
							stroke="currentColor"
							stroke-width="4"
						></circle>
						<path
							className="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
						></path>
					</svg>
					<span>Loading...</span>
				</div>
			)}
		</div>
	);
}

export function shortenAddress(address) {
	return address ? address.slice(0, 6) + "..." + address.slice(-4) : "";
}

function getRpcUrl(i) {
	return nodeRpcs[i];
}

export default App;
