$(document).ready(function(){

    $('#register-form').submit(function(){
        var isValidInput = true;

        var username = $("#username").val();
        var username_regex = new RegExp("[a-zA-Z0-9]{8,20}");
        isValidInput = username_regex.test(username);
        if(!isValidInput){
            console.log('Invalid username');
            $('.auth-error-message').html(generateAlertMessage('Invalid username format. Should contain only numbers and letters of length 8-20 characters.'));
            $('#username').focus();
            return false;
        }

        var password = $("#password").val();
        var confirmpwd = $("#confirm-password").val();
        var password_regex = new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,20})");
        if(password !== confirmpwd){
            console.log("Passwords do not match");
            $('.auth-error-message').html(generateAlertMessage('Both passwords do not match'));
            //alert('Passwords do not match');
            $('#password').focus();
            return false;
        }

        isValidInput = password_regex.test(password);
        if(!isValidInput){
            console.log('Password does not match expected pattern');
            $('.auth-error-message').html(generateAlertMessage('Password does not match expected pattern. Should contain atleast 1 number, 1 upper case letter, 1 lower case letter and 1 special character (!@#$%^&*). Maximum allowed length is 8-20 characters.'));
            //alert('Password does not match expected pattern');
            $('#password').focus();
            return false;
        }

        isValidInput = password_regex.test(confirmpwd);
        if(!isValidInput){
            console.log('Confirm Password does not match expected pattern');
            $('.auth-error-message').html(generateAlertMessage('Confirm Password does not match expected pattern. Should contain atleast 1 number, 1 upper case letter, 1 lower case letter and 1 special character (!@#$%^&*). Maximum allowed length is 8-20 characters.'));
            //alert('Confirm Password does not match expected pattern');
            $("#confirm-password").focus();
            return false;
        }

        var fullname = $("#fullname").val();
        var name_regex = /^[a-zA-Z ]{4,30}$/;
        isValidInput = name_regex.test(fullname);
        if(!isValidInput){
            console.log('Invalid full name');
            $('.auth-error-message').html(generateAlertMessage("Invalid Full Name format. Only alphabets allowed along with space"));
            $('#fullname').focus();
            return false;
        }

        var question = $("#security-question").val();
        var answer = $("#sec-answer").val();
        var answer_regex = /^[A-Za-z0-9]{1,16}$/;
        isValidInput = answer_regex.test(answer);
        if(!isValidInput){
            console.log('Invalid answer');
            $('.auth-error-message').html(generateAlertMessage('Invalid answer format. Alphanumeric characters only of max length 16 characters'));
            $('#sec-answer').focus();
            return false;
        }

        var email = $('#email').val();
        console.log("Validated!!");
        var data = {
            username: username,
            password: password,
            email: email,
            name: fullname,
            question: question,
            answer: answer
        }
        console.log(data);
        
        return isValidInput;
    });

    $('#login-form').submit(function(){
        var isValidInput = true;

        var username = $("#username").val();
        var username_regex = new RegExp("[a-zA-Z0-9]{8,20}");
        isValidInput = username_regex.test(username);
        if(!isValidInput){
            console.log('Invalid username');
            $('.auth-error-message').html(generateAlertMessage('Invalid username format. Should contain only numbers and letters of length 8-20 characters.'));
            $('#username').focus();
            return false;
        }
        return true;
    });

	$('#reset-pwd-form').submit(function(){
        var isValidInput = true;

        var password = $("#reset_pwd").val();
        var confirmpwd = $("#reset_pwd_cnf").val();
        var password_regex = new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,20})");
        if(password !== confirmpwd){
            console.log("Passwords do not match");
            $('.auth-error-message').html(generateAlertMessage('Both passwords do not match'));
            //alert('Passwords do not match');
            $('#reset_pwd').focus();
            return false;
        }

        isValidInput = password_regex.test(password);
        if(!isValidInput){
            console.log('Password does not match expected pattern');
            $('.auth-error-message').html(generateAlertMessage('Password does not match expected pattern. Should contain atleast 1 number, 1 upper case letter, 1 lower case letter and 1 special character (!@#$%^&*). Maximum allowed length is 8-20 characters.'));
            //alert('Password does not match expected pattern');
            $('#reset_pwd').focus();
            return false;
        }

        isValidInput = password_regex.test(confirmpwd);
        if(!isValidInput){
            console.log('Confirm Password does not match expected pattern');
            $('.auth-error-message').html(generateAlertMessage('Confirm Password does not match expected pattern. Should contain atleast 1 number, 1 upper case letter, 1 lower case letter and 1 special character (!@#$%^&*). Maximum allowed length is 8-20 characters.'));
            //alert('Confirm Password does not match expected pattern');
            $("#reset_pwd_cnf").focus();
            return false;
        }
        console.log("Validated!!");        
        return isValidInput;
    });
	
	
	
});

function generateAlertMessage(msg){
    var html = '<div class="alert alert-danger alert-dismissable fw-alert">' +
					'<a href="#" class="close" data-dismiss="alert" aria-label="close">×</a>' + 
					msg + '</div>';
	return html;
}
    
