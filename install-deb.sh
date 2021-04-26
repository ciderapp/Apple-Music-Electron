#!/bin/bash 

# check if yarn is installed, if not, install
if ! yarn --version &> /dev/null
then 
  echo -e "\nYarn is not detected, installing\n"
  curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
  echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list
  sudo apt update
  sudo apt install yarn -y
  echo -e "\nYarn installed\n"
fi 

echo "Yarn is installed, continuing"


echo -e "\n===== Installing =====\n"

yarn install

echo -e "\n===== Building =====\n"

yarn dist

my_file=$(find dist/*.deb)
sudo dpkg -i $my_file

echo -e "\nInstall Complete"
