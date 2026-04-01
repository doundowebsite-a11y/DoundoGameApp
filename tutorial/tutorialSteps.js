/**
 * tutorialSteps.js — src/tutorial/tutorialSteps.js
 *
 * TWO TYPES OF STEPS:
 *   type:'explain' — tooltip + hand pointer, tap NEXT to continue
 *   type:'do'      — hand animates the action, player must perform it
 *
 * tooltipAnchor: 'top'|'middle'|'bottom'
 *   Controls where tooltip bubble appears so it never covers the spotlight.
 *
 * handAnim: 'tap'|'drag_hand_to_cell'|null
 */

const DECK_SYMS = ['ARES','GAIA','HERA','TITAN','SHIVA','ENKI','MITRA','LAOZI','SETNA','AHURA','ASGARD','SHAMAN'];
const WIN_HAND  = ['ARES','GAIA','HERA','TITAN'];

function makeWinBoard() {
  const other = DECK_SYMS.filter(s => !WIN_HAND.includes(s));
  return Array(4).fill(null).map((_,r) =>
    Array(4).fill(null).map((_,c) => [{
      uid: 800 + r*4 + c,
      sym: r === 0 ? WIN_HAND[c] : other[(r*4+c) % other.length],
    }])
  );
}

function makeRandomBoard(filled = 8) {
  let uid = 400;
  return Array(4).fill(null).map((_,r) =>
    Array(4).fill(null).map((_,c) => {
      const idx = r*4+c;
      if (idx < filled) return [{ uid: uid++, sym: DECK_SYMS[(idx * 3 + 7) % DECK_SYMS.length] }];
      return [];
    })
  );
}

export const TUTORIAL_STEPS = [
  // ── A: Orientation ───────────────────────────────────────────────
  {
    id:'welcome', type:'explain', tooltipAnchor:'middle', spotlight:'none', handAnim:null,
    title:'Welcome to Doundo! 👋',
    body:"Quick tour first — then you play for real. Tap NEXT to explore each part of the screen.",
  },
  {
    id:'orient_opp', type:'explain', tooltipAnchor:'middle', spotlight:'opp_section', handAnim:'tap',
    title:"Opponent's Cards 🎴",
    body:"Up top is your opponent — their 4 cards are face-down. You can't see them until a Face-Off is called.",
  },
  {
    id:'orient_layers', type:'explain', tooltipAnchor:'middle', spotlight:'pills', handAnim:'tap',
    title:'Layer Tracker 📊',
    body:"L1 → L2 → L3 shows your current layer. Fill all 16 board cells to advance to the next layer.",
  },
  {
    id:'orient_board', type:'explain', tooltipAnchor:'bottom', spotlight:'board', handAnim:'tap',
    title:'The 4×4 Board 🎯',
    body:"16 cells to fill. Place cards here layer by layer. Match any full row or column with your hand to WIN a round!",
  },
  {
    id:'orient_hand', type:'explain', tooltipAnchor:'top', spotlight:'hand', handAnim:'tap',
    title:'Your Hand 🃏',
    body:"Your 4 cards. Drag one onto the board, or tap a card then tap a cell. You always refill to 4 after placing.",
  },
  {
    id:'orient_draw', type:'explain', tooltipAnchor:'top', spotlight:'draw', handAnim:'tap',
    title:'Draw Button',
    body:"Every turn STARTS by drawing a card from the deck. Draw first, then place it. The number shows cards remaining.",
  },
  {
    id:'orient_actions', type:'explain', tooltipAnchor:'top', spotlight:'action_bar', handAnim:'tap',
    title:'FACE-OFF & WIN',
    body:"Use these BEFORE drawing — at the start of your turn.\n⚡ FACE-OFF challenges the opponent's hand.\n👑 WIN calls victory if your hand matches a board row.",
  },

  // ── B: Draw & Place ───────────────────────────────────────────────
  {
    id:'do_draw', type:'do', tooltipAnchor:'top', spotlight:'draw', handAnim:'tap',
    title:'Draw Your First Card',
    body:"Tap DRAW CARD to begin your turn.",
    waitFor:'DRAW_CARD',
  },
  {
    id:'do_place', type:'do', tooltipAnchor:'top', spotlight:'hand_and_board', handAnim:'drag_hand_to_cell',
    title:'Place It on the Board',
    body:"Drag a card from your hand onto any empty cell. Or tap a card, then tap a cell.",
    waitFor:'PLACE_CARD',
  },

  // ── C: Call Win ───────────────────────────────────────────────────
  {
    id:'explain_win_setup', type:'explain', tooltipAnchor:'middle', spotlight:'hand_and_board', handAnim:null,
    title:'How to WIN 👑',
    body:"Your hand has 4 cards. If they exactly match any row or column on the board — all 4 symbols — you call WIN to claim the round!",
    inject: gs => ({
      board: makeWinBoard(),
      playerHand: WIN_HAND.map((sym,i) => ({ uid:700+i, sym })),
      currentLayer:1, phase:'draw', drawPile: gs.drawPile,
    }),
  },
  {
    id:'explain_win_match', type:'explain', tooltipAnchor:'top', spotlight:'win', handAnim:'tap',
    title:'The Match is Ready ✅',
    body:"Row 1 on the board: ARES, GAIA, HERA, TITAN.\nYour hand: ARES, GAIA, HERA, TITAN.\nPerfect match! Tap WIN to win this round.",
  },
  {
    id:'do_win', type:'do', tooltipAnchor:'top', spotlight:'win', handAnim:'tap',
    title:'Tap WIN! 👑',
    body:"Your hand matches Row 1. Tap WIN now!",
    waitFor:'CALL_WIN',
  },

  // ── D: Face-Off ───────────────────────────────────────────────────
  {
    id:'explain_fo', type:'explain', tooltipAnchor:'middle', spotlight:'opp_section', handAnim:null,
    title:'The Face-Off ⚡',
    body:"Before drawing, call Face-Off to reveal both hands. 2+ matching symbols = YOU win. Fewer = OPPONENT wins. High risk, high reward!",
    inject: gs => ({
      ...gs, phase:'draw',
      playerHand:[{uid:601,sym:'ARES'},{uid:602,sym:'ARES'},{uid:603,sym:'SHIVA'},{uid:604,sym:'GAIA'}],
      aiHand:    [{uid:611,sym:'ARES'},{uid:612,sym:'ARES'},{uid:613,sym:'TITAN'},{uid:614,sym:'LAOZI'}],
    }),
  },
  {
    id:'explain_fo_match', type:'explain', tooltipAnchor:'top', spotlight:'faceoff', handAnim:'tap',
    title:'2 Matching ARES! 🎯',
    body:"You and the opponent both have 2 ARES cards — that's 2 matches. Call Face-Off and you'll win this round!",
  },
  {
    id:'do_fo', type:'do', tooltipAnchor:'top', spotlight:'faceoff', handAnim:'tap',
    title:'Call Face-Off! ⚡',
    body:"You have 2 matching ARES. Tap FACE-OFF!",
    waitFor:'FACE_OFF',
  },

  // ── E: Swap ───────────────────────────────────────────────────────
  {
    id:'explain_swap', type:'explain', tooltipAnchor:'bottom', spotlight:'board', handAnim:null,
    title:'The Swap ⇄',
    body:"After drawing, tap SWAP instead of placing. Pick a board card → move it to an empty cell → place your hand card where the board card was. Great for setting up winning rows!",
    inject: gs => {
      // Phase is 'place' (card already drawn) — 5 cards in hand as if they drew
      // This means SWAP button is immediately available
      const drawnCard = gs.drawPile[0] ?? { uid: 550, sym: 'SHIVA' };
      return {
        phase: 'place',
        currentLayer: 1,
        board: makeRandomBoard(8),
        playerHand: [
          { uid:501, sym:'ARES' }, { uid:502, sym:'GAIA' },
          { uid:503, sym:'TITAN' }, { uid:504, sym:'HERA' },
          drawnCard,  // 5th card — the "drawn" card
        ],
        drawPile: gs.drawPile.slice(1),
      };
    },
  },
  {
    id:'do_swap_start', type:'do', tooltipAnchor:'top', spotlight:'swap', handAnim:'tap',
    title:'Tap SWAP to Start ⇄',
    body:"Tap the SWAP button.",
    waitFor:'SWAP_START',
  },
  {
    id:'do_swap_pick', type:'do', tooltipAnchor:'bottom', spotlight:'board', handAnim:'tap',
    title:'Pick a Board Card',
    body:"Tap any card on the board to displace it.",
    waitFor:'SWAP_PICK_BOARD',
  },
  {
    id:'do_swap_dest', type:'do', tooltipAnchor:'bottom', spotlight:'board', handAnim:'tap',
    title:'Choose Destination',
    body:"Tap an empty cell for the displaced card.",
    waitFor:'SWAP_PICK_DEST',
  },
  {
    id:'do_swap_hand', type:'do', tooltipAnchor:'top', spotlight:'hand_and_board', handAnim:'drag_hand_to_cell',
    title:'Place Your Card',
    body:"Drag a hand card to the now-empty cell!",
    waitFor:'SWAP_PLACE_HAND',
  },

  // ── Done ──────────────────────────────────────────────────────────
  {
    id:'done', type:'explain', tooltipAnchor:'middle', spotlight:'none', handAnim:null,
    title:"You're Ready! 🏆",
    body:"You know all the moves. Draw, place, match rows to win, Face-Off, and Swap your way to victory. Good luck!",
  },
];

export const STEP_COUNT = TUTORIAL_STEPS.length;
