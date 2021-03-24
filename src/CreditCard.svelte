<script>
import {
    onMount
} from 'svelte';

export let width = "400px";

export let investor = "INVESTOR";
export let cardNumber = "0000000000000000";
export let expDate = "03/21";
export let cardHolder = "Melih Altıntaş";
export let cvv = "000";

let flip;
let currentFocusElement;

let cardNumberElement;
let expDateElement;
let cardHolderElement;
let cvvElement;

$: getSrc = () => {
    return "https://raw.githubusercontent.com/MelihAltintas/svelte-credit-card/master/public/creditcards/" + cardType(cardNumber) +".png";
}
$: cardNumberData = cardNumber.padEnd(16, '#')

function cardType(number){

    let re = new RegExp('^4')
    if (number.match(re) != null) return 'visa'
    re = new RegExp('^(34|37)')
    if (number.match(re) != null) return 'amex'
    re = new RegExp('^5[1-5]')
    if (number.match(re) != null) return 'mastercard'
    re = new RegExp('^6011')
    if (number.match(re) != null) return 'discover'
    re = new RegExp('^62')
    if (number.match(re) != null) return 'unionpay'
    re = new RegExp('^9792')
    if (number.match(re) != null) return 'troy'
    re = new RegExp('^3(?:0([0-5]|9)|[689]\\d?)\\d{0,11}')
    if (number.match(re) != null) return 'dinersclub'
    re = new RegExp('^35(2[89]|[3-8])')
    if (number.match(re) != null) return 'jcb'
    return 'visa' // default type
}

export function focusCardNumber() {
    removeAllFocus();
    focusElement(cardNumberElement);
}

export function focusExpDateElement() {
    removeAllFocus();
    focusElement(expDateElement);
}

export function focusCardHolderElement() {
    removeAllFocus();
    focusElement(cardHolderElement);

}

export function focusCvvElement() {
    removeAllFocus();
    focusElement(cvvElement);
}

export function flipCard(index) {
    console.log("flip card");
    if (index == 1) {
        flip.style = 'transform: rotateY(180deg);';
    } else if (index == 0) {
        flip.style = '';
    }
}

function focusElement(element) {
    console.log(element.id, currentFocusElement)
    if (currentFocusElement == undefined && element.id == "cvv") {
        flipCard(1);
    } else if (currentFocusElement != undefined && currentFocusElement.id != "cvv" && element.id == "cvv") {
        flipCard(1);
    } else if (currentFocusElement != undefined && currentFocusElement.id == "cvv" && element.id != "cvv") {
        flipCard(0);
    }
    element.style = 'border:1px solid white;transition: border-width 0.6s linear;padding:3px';
    currentFocusElement = element;
}

function removeAllFocus() {
    cardNumberElement.style = '';
    expDateElement.style = '';
    cardHolderElement.style = '';
    cvvElement.style = '';
}

onMount(async () => {
    changeFocus();
});
</script>

<div class="center" >
    <div class="card" style="width:{width}">
        <div class="flip" bind:this={flip}>
            <div class="front">
                <div class="strip-bottom"></div>
                <div class="strip-top"></div>
                <img class="logo" src={getSrc()} alt="logo" width=100>
                <div class="investor" >{investor}</div>
                <div class="chip">
                    <div class="chip-line"></div>
                    <div class="chip-line"></div>
                    <div class="chip-line"></div>
                    <div class="chip-line"></div>
                    <div class="chip-main"></div>
                </div>
                <svg class="wave" viewBox="0 3.71 26.959 38.787" width="26.959" height="38.787" fill="white">
                    <path d="M19.709 3.719c.266.043.5.187.656.406 4.125 5.207 6.594 11.781 6.594 18.938 0 7.156-2.469 13.73-6.594 18.937-.195.336-.57.531-.957.492a.9946.9946 0 0 1-.851-.66c-.129-.367-.035-.777.246-1.051 3.855-4.867 6.156-11.023 6.156-17.718 0-6.696-2.301-12.852-6.156-17.719-.262-.317-.301-.762-.102-1.121.204-.36.602-.559 1.008-.504z"></path>
                    <path d="M13.74 7.563c.231.039.442.164.594.343 3.508 4.059 5.625 9.371 5.625 15.157 0 5.785-2.113 11.097-5.625 15.156-.363.422-1 .472-1.422.109-.422-.363-.472-1-.109-1.422 3.211-3.711 5.156-8.551 5.156-13.843 0-5.293-1.949-10.133-5.156-13.844-.27-.309-.324-.75-.141-1.114.188-.367.578-.582.985-.542h.093z"></path>
                    <path d="M7.584 11.438c.227.031.438.144.594.312 2.953 2.863 4.781 6.875 4.781 11.313 0 4.433-1.828 8.449-4.781 11.312-.398.387-1.035.383-1.422-.016-.387-.398-.383-1.035.016-1.421 2.582-2.504 4.187-5.993 4.187-9.875 0-3.883-1.605-7.372-4.187-9.875-.321-.282-.426-.739-.266-1.133.164-.395.559-.641.984-.617h.094zM1.178 15.531c.121.02.238.063.344.125 2.633 1.414 4.437 4.215 4.437 7.407 0 3.195-1.797 5.996-4.437 7.406-.492.258-1.102.07-1.36-.422-.257-.492-.07-1.102.422-1.359 2.012-1.075 3.375-3.176 3.375-5.625 0-2.446-1.371-4.551-3.375-5.625-.441-.204-.676-.692-.551-1.165.122-.468.567-.785 1.051-.742h.094z"></path>
                </svg>
                <div class="card-number" bind:this={cardNumberElement} id="card-number">
                    <div class="section" >{cardNumberData.substr(0,4)}</div>
                    <div class="section" >{cardNumberData.substr(4,4)}</div>
                    <div class="section" >{cardNumberData.substr(8,4)}</div>
                    <div class="section" >{cardNumberData.substr(12,4)}</div>
                </div>
                <div class="end" id="end" bind:this={expDateElement}><span class="end-text">exp. end: </span><span class="end-date"> {expDate}</span></div>
                <br>
                <div class="card-holder" id="card-holder" bind:this={cardHolderElement}>{cardHolder}</div>
         
            </div>
            <div class="back">
                <div class="strip-black"></div>
                <div class="ccv" bind:this={cvvElement} id="cvv">
                    <label for="cvv">CVV</label>
                    <div>{cvv}</div>
                </div>

            </div>
        </div>
    </div>

</div>

  <style>
.card {
    height: 280px;
}

.flip {
    width: inherit;
    height: inherit;
    transition: 0.7s;
    transform-style: preserve-3d;
}

.front,
.back {
    position: absolute;
    width: inherit;
    height: inherit;
    border-radius: 15px;
    color: #fff;
    text-shadow: 0 1px 1px rgba(0, 0, 0, 0.3);
    box-shadow: 0 1px 10px 1px rgba(0, 0, 0, 0.3);
    -webkit-backface-visibility: hidden;
    backface-visibility: hidden;
    background-image: linear-gradient(to right, #111, #555);
    overflow: hidden;
}

.front {
    transform: translateZ(0);
}

.strip-bottom,
.strip-top {
    position: absolute;
    right: 0;
    height: inherit;
    background-image: linear-gradient(to bottom, #ff6767, #ff4545);
    box-shadow: 0 0 10px 0px rgba(0, 0, 0, 0.5);
}

.strip-bottom {
    width: 200px;
    transform: skewX(-15deg) translateX(50px);
}

.strip-top {
    width: 180px;
    transform: skewX(20deg) translateX(50px);
}

.logo {
    position: absolute;
    top: 30px;
    right: 25px;
}

.investor {
    position: relative;
    top: 30px;
    left: 25px;
    text-transform: uppercase;
}

.chip {
    position: relative;
    top: 60px;
    left: 25px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 50px;
    height: 40px;
    border-radius: 5px;
    background-image: linear-gradient(to bottom left, #ffecc7, #d0b978);
    overflow: hidden;
}

.chip .chip-line {
    position: absolute;
    width: 100%;
    height: 1px;
    background-color: #333;
}

.chip .chip-line:nth-child(1) {
    top: 13px;
}

.chip .chip-line:nth-child(2) {
    top: 20px;
}

.chip .chip-line:nth-child(3) {
    top: 28px;
}

.chip .chip-line:nth-child(4) {
    left: 25px;
    width: 1px;
    height: 50px;
}

.chip .chip-main {
    width: 20px;
    height: 25px;
    border: 1px solid #333;
    border-radius: 3px;
    background-image: linear-gradient(to bottom left, #efdbab, #e1cb94);
    z-index: 1;
}

.wave {
    position: relative;
    top: 20px;
    left: 100px;
}

.card-number {
    position: relative;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 40px 25px 10px;
    font-size: 23px;
    font-family: 'cc font', monospace;
    padding: 3px;
    
}

.end {
    margin-left: 25px;
    text-transform: uppercase;
    font-family: 'cc font', monospace;
    padding: 3px;
    display: inline-block;
}

.end .end-text {
    font-size: 9px;
    color: rgba(255, 255, 255, 0.8);

}

.card-holder {
    margin: 10px 25px;
    text-transform: uppercase;
    font-family: 'cc font', monospace;
    padding: 3px;
    display: inline-block;
}






.card {
    perspective: 1000;
}

.back {
    transform: rotateY(180deg) translateZ(0);
    background: #9e9e9e;
}

.back .strip-black {
    position: absolute;
    top: 30px;
    left: 0;
    width: 100%;
    height: 50px;
    background: #000;
}

.back .ccv {
    position: absolute;
    top: 110px;
    left: 0;
    right: 0;
    height: 36px;
    width: 90%;
    padding: 10px;
    margin: 0 auto;
    border-radius: 5px;
    text-align: right;
    letter-spacing: 1px;
    color: #000;
    background: #fff;
    padding: 3px;
}

.back .ccv label {
    display: block;
    margin: -30px 0 15px;
    font-size: 10px;
    text-transform: uppercase;
    color: #fff;
}

@-webkit-keyframes flip {

    0%,
    100% {
        transform: rotateY(0deg);
    }

    50% {
        transform: rotateY(180deg);
    }
}

@keyframes flip {

    0%,
    100% {
        transform: rotateY(0deg);
    }

    50% {
        transform: rotateY(180deg);
    }
}
</style>
