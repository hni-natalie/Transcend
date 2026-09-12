# source ./dev/.env

BORDER='-----------------------'
PORT=443

run_test() {
	case $1 in
	1)
		echo -e "Test validations\n$BORDER"
		bash ./test_validation.sh
		;;
	2)
		echo -e "Test HTTPS with openssl\n$BORDER"
		bash ./test-https-openssl.sh
		;;
	3)
		echo -e "Test HTTPS with wget/curl\n$BORDER"
		bash ./test-https.sh
		;;
	4)
		echo -e "Test rate limit\n$BORDER"
		bash ./test-rate-limit.sh
		;;
	*)
		echo "Running all tests ..."
		for i in {1..4}; do
			run_test $i
		done
		;;
	esac
}

run_test $1