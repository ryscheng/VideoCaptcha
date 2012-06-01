run:
	python server.py &
	python appserver.py &

kill:
	pkill -f "python server.py" &
	pkill -f "python appserver.py"

status:
	ps -ef | grep "python server.py" | grep -v "grep" &
	ps -ef | grep "python appserver.py" | grep -v "grep"

