<script>
import CreditCard from './CreditCard.svelte'

let creditCard;

let investor = "INVESTOR";
let cardNumber = "";
let expDate = "";
let cardHolder = "";
let cvv = "";
</script>
<div class="container">
	<div class="card mx-auto col-md-6 mt-3 p-0">
	   <CreditCard {investor} {cardNumber} {expDate} {cardHolder} {cvv} bind:this={creditCard} width="100%"/>
	   <div class="card-title d-flex px-4">
		  <p class="item text-muted">Barcelona
		  </p>
		  <p>$5760</p>
	   </div>
	   <div class="card-body">
		  <p class="text-muted">Your payment details</p>
		  <div class="numbr mb-3">
			 <input class="col-12 p-0" type="text" placeholder="Card Number" bind:value={cardNumber}  on:focus={creditCard.focusCardNumber()}>
		  </div>
		  <div class="numbr mb-3">
			 <input class="col-12 p-0" type="text" placeholder="Card Holder" bind:value={cardHolder} on:focus={creditCard.focusCardHolderElement()}>
		  </div>
		  <div class="numbr mb-3">
			 <input class="cal col-12 p-0" type="text" placeholder="MM/YY" bind:value={expDate} on:focus={creditCard.focusExpDateElement()}>
		  </div>
		  <div class="numbr mb-3">
			 <input class="cal col-12 p-0" type="text" placeholder="CVV" bind:value={cvv}  on:focus={creditCard.focusCvvElement()}>
		  </div>
	   </div>
	   <div class="footer text-center p-0">
		  <div class="col-lg-12 col-12 p-0">
			 <p class="order">Order Now</p>
		  </div>
	   </div>
	</div>
 </div>

<style>
@import url("https://stackpath.bootstrapcdn.com/bootstrap/4.5.0/css/bootstrap.min.css");

.card-title {
    justify-content: space-between;
    margin-top: 25px
}

input {
    border: none;
    padding-left: 4px;
    background-color: #f7f1f1;
    font-size: 15px
}

.card-body {
    background-color: #f7f1f1
}

.footer {
    background-color: #00BCD4;
    color: white
}

.footer:hover {
    cursor: pointer;
    background-color: #0097A7
}

.numbr {
    border-bottom: 1px solid #c1bcbc;
    padding-bottom: 8px
}

input:focus {
    outline: 0;
    box-shadow: none !important
}

.numbr:hover {
    border-bottom: 1px solid aqua
}

.order {
    margin-top: 10px
}
</style>
