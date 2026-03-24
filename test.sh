#/!/bin/bash

# ------------------------------------------
# Readme
# ------------------------------------------
# run specific test (eg test1)	./test.sh 1
# else run all:									./test.sh


BORDER='-----------------------'
SERVER_NAME='localhost'
PORT=443

run_test() {
	case $1 in
	1)
		echo -e "Test HTTPS connection\n$BORDER"
		curl -k -I "https://$SERVER_NAME:$PORT"
		;;
	2)
		echo -e "Test HTTP connection (should fail)\n$BORDER"
		curl -k -I "http://$SERVER_NAME"
		;;
	3)
		echo -e "Test certificates by sending request using openssl\n$BORDER"
		openssl s_client -connect "$SERVER_NAME:$PORT" -showcerts < /dev/null
		;;
	4)
		echo -e "Test TLS v1.2 connection\n$BORDER"
		curl -vkI --tlsv1.2 --tls-max 1.2 https://$SERVER_NAME:$PORT/ 2>&1
		;;
	5)
		echo -e "Test TLS v1.3 connection\n$BORDER"
		curl -vkI --tlsv1.3 --tls-max 1.3 https://$SERVER_NAME:$PORT/ 2>&1
		;;
	6)
		echo -e "Test TLS v1.1 connection (should fail)\n$BORDER"
		curl -vkI --tlsv1.1 --tls-max 1.1 https://$SERVER_NAME:$PORT/ 2>&1
		;;
	100)
		echo -e "Clearing all dockers\n$BORDER"
		docker stop $(docker ps -qa) 2>/dev/null
		docker rm -f $(docker ps -qa) 2>/dev/null
		docker rmi -f $(docker images -qa) 2>/dev/null
		docker volume rm $(docker volume ls -q) 2>/dev/null
		docker network rm $(docker network ls -q) 2>/dev/null
		;;
	*)
		echo "Running all tests ..."
		for i in {1..6}; do
			run_test $i
		done
		;;
	esac
}

run_test $1