import {strictEqual} from "assert"
import {Paloma, Router} from "./lib.js";
import {
    NativeAsset,
    newClient,
    readArtifact,
    TokenAsset,
    NativeSwap,
    AstroSwap
} from "../helpers.js"
import util from "util";
import {Coin } from "@palomachain/paloma.js";

async function main() {
    const cl = newClient()
    const network = readArtifact(cl.terra.config.chainID)

    const paloma = new Paloma(cl.terra, cl.wallet);
    console.log(`chainID: ${cl.terra.config.chainID} wallet: ${cl.wallet.key.accAddress}`)

    const router = paloma.router(network.routerAddress);
    console.log("router config: ", await router.queryConfig());

    // 1. Provide ASTRO-UST liquidity
    const liquidity_amount = 10000000;
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

    // 4. Assert minimum receive
    await assertMinimumReceive(router, cl.wallet.key.accAddress);

    // 5. Swap tokens
    await swapFromCW20(router, network, paloma, cl.wallet.key.accAddress);

    // 6. Swap native tokens
    await swapFromNative(router, network, paloma, cl.wallet.key.accAddress);
}

async function assertMinimumReceive(router: Router, accAddress: string) {
    const swap_amount = 1000;
    try {
        let minReceive = await router.assertMinimumReceive(
            new NativeAsset("ugrain", swap_amount.toString()), "1000", "10000000000000000", accAddress);
        console.log("Assert minimum receive: ", util.inspect(minReceive, false, null, true));
    } catch (e: any) {
        console.log("assertMinimumReceive status code: ", e.response.status);
        console.log("assertMinimumReceive data: ", e.response.data);
    }
}

async function swapFromCW20(router: Router, network: any, paloma: Paloma, accAddress: string) {
    // to get an error, set the minimum amount to be greater than the exchange amount
    const swap_amount = 1000;
    let min_receive = swap_amount + 1;
    try {
        let resp = await router.swapOperationsCW20(network.tokenAddress, swap_amount.toString(), min_receive.toString(),
            [new AstroSwap(new TokenAsset(network.tokenAddress), new NativeAsset("uusd"))]
        );
        console.log("swap: ", util.inspect(resp, false, null, true));
    } catch (e: any) {
        console.log("swapOperationsCW20 status code: ", e.response.status);
        console.log("swapOperationsCW20 data: ", e.response.data);
    }

    let astro_balance_before_swap = await paloma.getTokenBalance(network.tokenAddress, accAddress);
    console.log(`astro balance before swap: ${astro_balance_before_swap}`)

    let ugrain_balance_before_swap = await paloma.getNativeBalance(accAddress, "ugrain");
    console.log(`ugrain balance before swap: ${ugrain_balance_before_swap}`)

    // swap with the correct parameters
    try {
        let resp = await router.swapOperationsCW20(network.tokenAddress, swap_amount.toString(), "1",
            [
                new AstroSwap(new TokenAsset(network.tokenAddress), new NativeAsset("uusd")),
                new NativeSwap("uusd", "ugrain"),
            ]
        );
        console.log("swap: ", util.inspect(resp, false, null, true));
    } catch (e: any) {
        console.log("swapOperationsCW20 status code: ", e.response.status);
        console.log("swapOperationsCW20 data: ", e.response.data);
    }

    let astro_balance_after_swap = await paloma.getTokenBalance(network.tokenAddress, accAddress);
    console.log(`astro balance after swap: ${astro_balance_after_swap}`);
    strictEqual(astro_balance_before_swap, astro_balance_after_swap + swap_amount);

    let swapRate = await paloma.terra.market.swapRate(new Coin("uusd", swap_amount), "ugrain");
    console.log("swapRate: ", swapRate);

    let ugrain_balance_after_swap = await paloma.getNativeBalance(accAddress, "ugrain");
    console.log(`ugrain balance after swap: ${ugrain_balance_after_swap}`);

    strictEqual(ugrain_balance_before_swap?.amount.toNumber(),
        ugrain_balance_after_swap?.add(swapRate).amount.toNumber());
}

async function swapFromNative(router: Router, network: any, paloma: Paloma, accAddress: string) {
    const swap_amount = 1000;
    let ugrain_balance_before_swap = await paloma.getNativeBalance(accAddress, "ugrain");
    console.log(`ugrain balance before swap: ${ugrain_balance_before_swap}`);

    let astro_balance_before_swap = await paloma.getTokenBalance(network.tokenAddress, accAddress);
    console.log(`astroBalance before swap: ${astro_balance_before_swap}`);

    try {
        let resp = await router.swapOperations([
            new NativeSwap("ugrain", "uusd"),
            new AstroSwap(new NativeAsset("uusd"), new TokenAsset(network.tokenAddress)),],
            new Coin("ugrain", swap_amount)
        );
        console.log(util.inspect(resp, false, null, true))
    } catch (e: any) {
        console.log("swapOperations status code: ", e.response.status);
        console.log("swapOperations data: ", e.response.data);
    }

    let ugrain_balance_after_swap = await paloma.getNativeBalance(accAddress, "ugrain");
    console.log(`ugrain balance after swap: ${ugrain_balance_after_swap}`);
    strictEqual(ugrain_balance_before_swap?.amount.toNumber(), ugrain_balance_after_swap?.sub(swap_amount).amount.toNumber());

    let swapRate = await paloma.terra.market.swapRate(new Coin("ugrain", swap_amount), "uusd");
    console.log("swapRate: ", swapRate);

    let astro_balance_after_swap = await paloma.getTokenBalance(network.tokenAddress, accAddress);
    console.log(`astro balance after swap: ${astro_balance_after_swap}`);

    strictEqual(astro_balance_before_swap, astro_balance_after_swap + swapRate.amount.toNumber());
}

async function provideLiquidity(network: any, paloma: Paloma, accAddress: string, poolAddress: string, assets: (NativeAsset|TokenAsset)[]) {
    const pool = paloma.pair(poolAddress);
    let pair_info = await pool.queryPair();
    console.log(util.inspect(pair_info, false, null, true));

    // Provide liquidity to swap
    await pool.provideLiquidity(assets[0], assets[1])

    let astro_balance = await paloma.getTokenBalance(network.tokenAddress, accAddress);
    let xastro_balance = await paloma.getTokenBalance(network.xastroAddress, accAddress);

    console.log(`ASTRO balance: ${astro_balance}`)
    console.log(`xASTRO balance: ${xastro_balance}`)
}

main().catch(console.log)
