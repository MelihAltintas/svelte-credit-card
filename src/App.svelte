<script>
import CreditCard from './CreditCard.svelte'

let creditCard;


let investor = "INVESTOR";
let cardNumber = "0000500000000000";
let expDate = "03/22";
let cardHolder = "Melih Altıntaş";
let ccv = "000";

</script>

<main>
    <CreditCard {investor} {cardNumber} {expDate} {cardHolder} {ccv} bind:this={creditCard}/>
	<form>
		<label for="investor">Investor:</label>
		<input type="text" bind:value={investor} id="investor" name="investor" ><br>

		<label for="cardNumber">Card Number:</label>
		<input type="text" bind:value={cardNumber} id="cardNumber" name="cardNumber" on:focus={creditCard.focusCardNumber()}>

		<label for="cardHolder">Card Holder:</label>
		<input type="text" bind:value={cardHolder} id="cardHolder" name="cardHolder" on:focus={creditCard.focusCardHolderElement()}>

		<label for="expDate">Exp Date:</label>
		<input type="text" bind:value={expDate} id="expDate" name="expDate" on:focus={creditCard.focusExpDateElement()}>

		<label for="ccv">CCV:</label>
		<input type="text" bind:value={ccv} id="ccv" name="ccv" on:focus={creditCard.focusCcvElement()}>
	  </form>
</main>
