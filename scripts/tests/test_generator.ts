import {Paloma, Generator} from "./lib.js";
import {provideLiquidity} from "./test_router.js"
import {
    NativeAsset,
    newClient,
    readArtifact, TokenAsset,
} from "../helpers.js"

async function main() {
    const cl = newClient()
    const network = readArtifact(cl.terra.config.chainID)

    const paloma = new Paloma(cl.terra, cl.wallet);
    console.log(`chainID: ${cl.terra.config.chainID} wallet: ${cl.wallet.key.accAddress}`)

    // 1. Provide ASTRO-UST liquidity
    const liquidity_amount = 5000000;
    await provideLiquidity(network, paloma, cl.wallet.key.accAddress, network.poolAstroUst, [
        new NativeAsset('uusd', liquidity_amount.toString()),
        new TokenAsset(network.tokenAddress, liquidity_amount.toString())
    ])

    // 2. Provide GRAIN-UST liquidity
    await provideLiquidity(network, paloma, cl.wallet.key.accAddress, network.poolGrainUst, [
        new NativeAsset('ugrain', liquidity_amount.toString()),
        new NativeAsset('uusd', liquidity_amount.toString())
    ])

    // 3. Fetch the pool balances
    let lpTokenAstroUst = await paloma.getTokenBalance(network.lpTokenAstroUst, cl.wallet.key.accAddress);
    let lpTokenGrainUst = await paloma.getTokenBalance(network.lpTokenGrainUst, cl.wallet.key.accAddress);

    console.log(`AstroUst balance: ${lpTokenAstroUst}`)
    console.log(`GrainUst balance: ${lpTokenGrainUst}`)

    const generator = paloma.generator(network.generatorAddress);
    console.log("generator config: ", await generator.queryConfig());

    // 4. Register generators
    await generator.registerGenerator([
        [network.lpTokenAstroUst, "24528"],
        [network.lpTokenGrainUst, "24528"],
    ])

    // 4. Deposit to generator
    await generator.deposit(network.lpTokenAstroUst, "623775")
    await generator.deposit(network.lpTokenGrainUst, "10000000")

    // 5. Fetch the deposit balances
    console.log(`deposited: ${await generator.queryDeposit(network.lpTokenAstroUst, cl.wallet.key.accAddress)}`)
    console.log(`deposited: ${await generator.queryDeposit(network.lpTokenGrainUst, cl.wallet.key.accAddress)}`)

    // 6. Find checkpoint generators limit for user boost
    await findCheckpointGeneratorsLimit(generator, network)
}

async function findCheckpointGeneratorsLimit(generator: Generator, network: any) {
    let generators = []
    for(let i = 0; i < 40; i++) {
        generators.push(network.lpTokenAstroUst)
        generators.push(network.lpTokenGrainUst)
    }

    await generator.checkpointUserBoost(generators)

}

main().catch(console.log)
