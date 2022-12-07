use cosmwasm_schema::write_api;

use paloma::pair::InstantiateMsg;
use paloma::pair_bonded::{ExecuteMsg, QueryMsg};

fn main() {
    write_api! {
        instantiate: InstantiateMsg,
        query: QueryMsg,
        execute: ExecuteMsg,
    }
}
