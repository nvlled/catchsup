#!/bin/bash
cd react-src
npm run build
cd ..
neu build -r
cat <<EOF > ./dist/catchsup/catchsup.sh
#!/bin/bash
cd "\$(dirname "\$0")"
./catchsup-linux_x64
EOF
chmod +x ./dist/catchsup/catchsup.sh
