$("#playBtn").on('click', evt => {
	if (!$("#agreementCB").is(':checked')){
		evt.preventDefault();
		$("#agreementDiv b").css('color', 'red');
		//setTimeout(_ => {$("#agreementDiv b").css('color', '#818182');}, 200);
		
	}
});