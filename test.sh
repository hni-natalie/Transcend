#/!/bin/bash

# ------------------------------------------
# Readme
# run specific test (eg test1)	./test.sh 1
# else run all:									./test.sh
# ------------------------------------------

source ./dev/.env

BORDER='-----------------------'
PORT=443

run_test() {
	case $1 in
	1)
		echo -e "Test HTTPS frontend connection\n$BORDER"
		curl -k -I "https://$DOMAIN_NAME:$PORT"
		;;
	2)
		echo -e "Test HTTPS backend connection\n$BORDER"
		curl -kI "https://$DOMAIN_NAME:$PORT/api/health"
		;;
	3)
		echo -e "Test HTTP connection (should fail)\n$BORDER"
		curl -k -I "http://$DOMAIN_NAME"
		;;
	4)
		echo -e "Test HTTPS backend connection\n$BORDER"
		curl -k "https://$DOMAIN_NAME:$PORT/api/player"
		;;
	5)
		echo -e "Test backend socket.io connection\n$BORDER"
		curl -k "https://$DOMAIN_NAME:$PORT/api/socket.io/?EIO=4&transport=polling"
		;;
	6)
		echo -e "Test GET livekit token from Backend Express\n$BORDER"
		curl -k "https://$DOMAIN_NAME:$PORT/api/lk/token?roomName=myroom&participantName=John"
		;;
	# -------------------------------------------------------------------
	# test db ...
	# -------------------------------------------------------------------
	21)
		echo -e "Test database connection\n$BORDER"
		curl -k "https://$DOMAIN_NAME:$PORT/api/roles"
		;;
	# -------------------------------------------------------------------
	# test certificates ...
	# -------------------------------------------------------------------
	51)
		echo -e "Test certificates by sending request using openssl\n$BORDER"
		openssl s_client -connect "$DOMAIN_NAME:$PORT" -showcerts < /dev/null
		;;
	52)
		echo -e "Test TLS v1.2 connection\n$BORDER"
		curl -vkI --tlsv1.2 --tls-max 1.2 https://$DOMAIN_NAME:$PORT/ 2>&1
		;;
	53)
		echo -e "Test TLS v1.3 connection\n$BORDER"
		curl -vkI --tlsv1.3 --tls-max 1.3 https://$DOMAIN_NAME:$PORT/ 2>&1
		;;
	54)
		echo -e "Test TLS v1.1 connection (should fail)\n$BORDER"
		curl -vkI --tlsv1.1 --tls-max 1.1 https://$DOMAIN_NAME:$PORT/ 2>&1
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
		for i in {1..7}; do
			run_test $i
		done
		;;
	esac
}

run_test $1