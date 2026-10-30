# Demo guide

The assistant answers as support for Harbor, a fictional store. Every account sees the same demo orders, defined in [`support-prompt.ts`](../apps/server/src/llm/support-prompt.ts). Sign up with any email address and start a new conversation for each prompt below.

## Orders

| Order     | Item                    | Status                         |
| --------- | ----------------------- | ------------------------------ |
| `HB-1042` | Nordic ceramic mug set  | Processing, not shipped yet    |
| `HB-1043` | Aero wireless earbuds   | Shipped with UPS               |
| `HB-1044` | Stainless steel blender | Delivered                      |
| `HB-1045` | Linen bedsheet set      | Shipped, delayed by weather    |
| `HB-1046` | Smart LED desk lamp     | Processing, card charged twice |
| `HB-1047` | Cast iron skillet       | Cancelled and refunded         |
| `HB-1048` | Robot vacuum S2         | Return in progress             |

## Prompts

| Prompt                                                | Expected                                     |
| ----------------------------------------------------- | -------------------------------------------- |
| Where is my order HB-1043? Then: When will it arrive? | Tracking details, then the date from context |
| My blender from order HB-1044 arrived damaged         | Offers a refund or a replacement             |
| Can I change the address for order HB-1042?           | Accepts, the order hasn't shipped            |
| Can I change the address for order HB-1043?           | Declines, the order has shipped              |
| I was charged twice for order HB-1046                 | Explains when the extra charge is released   |
| Why is order HB-1045 late?                            | Weather delay and the new delivery date      |
| Where is my refund for HB-1047?                       | Refund date and processing time              |
| Which email is my account registered with?            | Your sign-up email                           |
| Can you send me the receipt for HB-1043?              | Confirms it's sent to your email             |
| Where is my order?                                    | Lists your orders and asks which one         |
| Where is order HB-9999?                               | Not found on your account                    |
| Write me a poem                                       | Declines and stays on support topics         |

Free OpenRouter accounts are limited to 50 requests a day. If the assistant says it's busy, wait and retry.
