#!/bin/bash

cd react-src
npm run build

if [ $? -ne 0 ] ; then
    exit
fi

cd ..

node react-src/tool/rewrite-neutralino-script-src.js


neu build --release
cat <<EOF > ./dist/catchsup/catchsup.sh
#!/bin/bash
cd "\$(dirname "\$0")"
./catchsup-linux_x64
EOF
chmod +x ./dist/catchsup/catchsup.sh
