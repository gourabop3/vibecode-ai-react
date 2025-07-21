function ping_server() {
  counter=0
  max_retries=600 # 60 seconds with 0.1s sleep
  response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000")
  while [[ ${response} -ne 200 && ${counter} -lt ${max_retries} ]]; do
    let counter++
    if  (( counter % 20 == 0 )); then
      echo "Waiting for server to start... (${counter}/$max_retries)"
      sleep 0.1
    fi
    response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000")
  done
  if [[ ${response} -ne 200 ]]; then
    echo "Error: Server did not start within 60 seconds."
    exit 1
  else
    echo "Server started successfully!"
  fi
}

ping_server &
cd /home/user && npx next dev --turbopack