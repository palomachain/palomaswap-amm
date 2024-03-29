# Astroport Router

The Router contract contains logic to facilitate multi-hop swaps for Terra native & Astroport tokens.

---

### Operations Assertion

For every swap, the contract checks if the resulting token is the one that was asked for and whether the receiving amount exceeds the minimum to receive.

## InstantiateMsg

Initializes the contract with the Astroport factory contract address.

```json
{
  "astroport_factory": "paloma..."
}
```

## ExecuteMsg

### `receive`

CW20 receive msg.

```json
{
  "receive": {
    "sender": "paloma...",
    "amount": "123",
    "msg": "<base64_encoded_json_string>"
  }
}
```

### `execute_swap_operation`

Swaps one token to another. _single_ defines whether this swap is single or part of a multi hop route. 
This message is for internal use.

### Example

Swap UST => mABNB

```json
{
   "execute_swap_operation": {
     "operation": {
        "astro_swap": {
          "offer_asset_info": {
            "native_token": {
              "denom": "uusd"
            }
          },
          "ask_asset_info": {
            "token": {
              "contract_addr": "paloma..."
            }
          }
        }
      },
     "to": "paloma...",
     "max_spread": "0.05",
     "single": false
   }
}
```

### `execute_swap_operations`

Performs multi-hop swap operations for native & Astroport tokens. Swaps execute one-by-one and the last swap will return the ask token. This function is public (can be called by anyone).

### Example

Swap KRT => UST => mABNB

```json
{
  "execute_swap_operations": {
    "operations": [
      {
        "native_swap":{
          "offer_denom":"ukrw",
          "ask_denom":"uusd"
        }
      },
      {
        "astro_swap": {
          "offer_asset_info": {
            "native_token": {
              "denom": "uusd"
            }
          },
          "ask_asset_info": {
            "token": {
              "contract_addr": "paloma..."
            }
          }
        }
      }
    ],
    "minimum_receive": "123",
    "to": "paloma...",
    "max_spread": "0.05"
  }
}
```

### `assert_minimum_receive`

Checks that an amount of ask tokens exceeds `minimum_receive`. This message is for internal use.

```json
{
  "assert_minimum_receive": {
    "asset_info": {
      "token": {
        "contract_addr": "paloma..."
      }
    },
    "prev_balance": "123",
    "minimum_receive": "123",
    "receiver": "paloma..."
  }
}
```

## QueryMsg

All query messages are described below. A custom struct is defined for each query response.

### `config`

Returns the general configuration for the router contract.

```json
{
  "config": {}
}
```

### `simulate_swap_operations`

Simulates multi-hop swap operations. Examples:

- KRT => UST => mABNB

```json
{
  "simulate_swap_operations" : {
    "offer_amount": "123",
    "operations": [
      {
        "native_swap": {
          "offer_denom": "ukrw",
          "ask_denom": "uusd"
        }
      },
      {
        "astro_swap": {
          "offer_asset_info": {
            "native_token": {
              "denom": "uusd"
            }
          },
          "ask_asset_info": {
            "token": {
              "contract_addr": "paloma..."
            }
          }
        }
      }
    ]
  }
}
```

- mABNB => UST => KRT

```json
{
  "simulate_swap_operations" : {
    "offer_amount": "123",
    "operations": [
    {
      "native_swap": {
        "offer_denom": "uusd",
        "ask_denom": "ukrw"
      }
    },
    {
      "astro_swap": {
        "offer_asset_info": {
          "token": {
            "contract_addr": "paloma..."
          }
        },
        "ask_asset_info": {
          "native_token": {
            "denom": "uusd"
          }
        }
      }
    }
  ]
  }
}
```
