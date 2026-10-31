<div align="center">

# Harbor Support

AI customer support chat for Harbor, a demo online store.

[![Live demo](https://img.shields.io/badge/demo-live-2ea44f?style=flat-square)](https://virallensassignment.vercel.app/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white)](apps/client/README.md)
[![Express](https://img.shields.io/badge/Express-5-000000?style=flat-square&logo=express&logoColor=white)](apps/server/README.md)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white)](apps/server/README.md)

[Live demo](https://virallensassignment.vercel.app/) · [Demo guide](docs/demo.md) · [Development](docs/development.md)

</div>

## Contents

- [Features](#features)
- [Getting started](#getting-started)
- [Usage](#usage)
- [Demo orders](#demo-orders)
- [Conversations](#conversations)
- [Keyboard shortcuts](#keyboard-shortcuts)
- [Troubleshooting](#troubleshooting)
- [Documentation](#documentation)

## Features

- Chat about orders, deliveries, refunds, returns and payments
- Follow-up questions use the earlier messages as context
- Saved conversations with AI-generated titles, search, rename and delete
- Edit a sent message to get a new reply
- Retry or discard messages that fail to send
- Light and dark mode
- Works on mobile

## Getting started

1. Open the [live demo](https://virallensassignment.vercel.app/) and select **Create an account**.
2. Sign up with any email and a password of at least 8 characters. Emails aren't verified.
3. Type a question or pick one of the suggestions.

Sessions last 7 days.

## Usage

Press <kbd>Enter</kbd> to send. Messages can be up to 4,000 characters.

The assistant knows the store's policies and your orders, and can:

- track an order and give the delivery date
- change the address of an order that hasn't shipped
- handle damaged items, refunds and replacements
- check return and refund status
- explain duplicate charges
- send receipts to your account email

It won't answer questions unrelated to support.

### Editing a message

Hover over your message and select the pencil icon (always visible on touch screens). Press <kbd>Enter</kbd> to save or <kbd>Escape</kbd> to cancel. The message and everything after it are replaced by the edited message and a new reply.

## Demo orders

Every account has the same orders:

| Order     | Item                    | Status                         |
| --------- | ----------------------- | ------------------------------ |
| `HB-1042` | Nordic ceramic mug set  | Processing, not shipped yet    |
| `HB-1043` | Aero wireless earbuds   | Shipped with UPS               |
| `HB-1044` | Stainless steel blender | Delivered                      |
| `HB-1045` | Linen bedsheet set      | Shipped, delayed by weather    |
| `HB-1046` | Smart LED desk lamp     | Processing, card charged twice |
| `HB-1047` | Cast iron skillet       | Cancelled and refunded         |
| `HB-1048` | Robot vacuum S2         | Return in progress             |

Some questions to try:

| Question                                      | Expected reply                         |
| --------------------------------------------- | -------------------------------------- |
| Where is my order HB-1043?                    | Tracking details                       |
| My blender from order HB-1044 arrived damaged | Refund or replacement                  |
| Can I change the address for order HB-1042?   | Yes, it hasn't shipped                 |
| I was charged twice for order HB-1046         | When the extra charge is released      |
| Where is my order?                            | Lists your orders and asks which one   |

More in the [demo guide](docs/demo.md).

## Conversations

The sidebar lists conversations by most recent activity. Older ones load as you scroll.

| Action        | How                                                     |
| ------------- | ------------------------------------------------------- |
| New           | **New conversation** at the top of the sidebar          |
| Search        | Search box in the sidebar, matches titles               |
| Rename        | **⋯** next to the conversation, then **Rename**         |
| Delete        | **⋯** next to the conversation, then **Delete**         |
| Hide sidebar  | Button at the top of the sidebar, or <kbd>Ctrl</kbd> + <kbd>B</kbd> |

Deleting a conversation also deletes its messages and can't be undone. Conversations are only visible to the account that created them.

Light/dark mode and log out are in the account menu at the bottom of the sidebar.

## Keyboard shortcuts

| Shortcut                                     | Action                   |
| -------------------------------------------- | ------------------------ |
| <kbd>Enter</kbd>                             | Send                     |
| <kbd>Shift</kbd> + <kbd>Enter</kbd>          | New line                 |
| <kbd>Escape</kbd>                            | Cancel edit              |
| <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>B</kbd>  | Toggle sidebar           |

## Troubleshooting

| Problem                    | Fix                                                                         |
| -------------------------- | --------------------------------------------------------------------------- |
| Message marked **Not sent** | **Retry** or **Discard**. Nothing is saved until a reply arrives            |
| Assistant is busy          | The demo uses a free AI plan with a daily limit. Wait and retry             |
| Send fails with another tab open | The conversation changed in the other tab. It reloads, then retry     |
| Logged out unexpectedly    | The session expired. Log in again                                           |
| **Harbor is unreachable**  | The server didn't respond. Check your connection and select **Try again**   |

## Documentation

| Document                           | Contents                                       |
| ---------------------------------- | ---------------------------------------------- |
| [Demo guide](docs/demo.md)         | All demo prompts and expected replies          |
| [Development](docs/development.md) | Tech stack, local setup, commands              |
| [Server](apps/server/README.md)    | API reference, security, reply generation      |
| [Client](apps/client/README.md)    | Routes, state, project structure              |
| [Deployment](docs/deployment.md)   | Docker Compose and Vercel                      |
