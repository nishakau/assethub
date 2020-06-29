pm2 stop assethubbackend
pm2 start /u03/ahweb/assethub/backend/bin/assethubbackend --watch
echo "node backend restarted . . ."
sudo systemctl restart httpd
echo "Apache Service restarted . . ."
pm2 log 0
