$("#sendBtn").on('click', evt => {
	evt.preventDefault();
	$('#sendResultDiv').removeClass('alert').removeClass('alert-success').removeClass('alert-danger');
	if ($('#nameinput').val().length < 3){
		$('#sendResultDiv').addClass('alert alert-danger').html("I can't believe your name is so short...");
		return;
	}
	if ($('#messageInput').val().length < 3){
		$('#sendResultDiv').addClass('alert alert-danger').html("You have to say to me? How is it possible? ");
		return;
	}
	$('#sendResultDiv').addClass('alert alert-success').html("Your opinion is very important to us");
})