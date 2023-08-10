#!/bin/bash

d=45
s=0.5
now=`date -R`
notesFile=".notes"
function nap() { 
    sleep $s
}
function waitEnter() { 
    if [[ -n "$@" ]] ; then
        echo -e "\n==================================================\n" >> $notesFile
        echo -n "$@" >> $notesFile
    fi
    prompt='<= '
    echo -n $prompt;read 
}
function p() {
    echo -e "$@" | delay=$d typewrite-text.ts &
    echo -e "$@" | espeak-ng
}
function advanceTime() {
    date -s "`date -R -d $1`" > /dev/null
}
function restoreTime() {
    echo restoring time
    date -s "$now"
}
function addNote() {
    echo $@ > .notes
}

# TODO: 


trap '{ restoreTime; exit 1; }' INT

echo $@ > $notesFile
clear
waitEnter "this to prepare before starting:
- turn off autoadjust time
- start notes-view.sh in a new terminal
- start clock-view.sh in a new terminal
- adjust proper window sizes
- start OBS
"

p "Greetings, person watching this video."
p "In this video, I will show a brief example on how I use catchsup."
nap
p
p "In case you just got lost and only randomly stumbled upon this video, let me give a short intro."
nap
p
p "Catchsup is a software tool that helps you find time to do other things."
p "It's like pomodoro, in that it helps you get started."
p "In addition, catchsup helps you do it consistently and develop a habit."
nap
p 
p "It's that tomato-colored application you see on the left."
waitEnter "hover mouse over the tomato window, and make circle motion"
p "But enough intro, let's get right into it."
nap

p "As you can see, there is a big green text that says "Read a book"."
p "There's also some text beneath it. It's some random quotes that show up."
nap
p "The big green text means it's \"due\" right now."
p "I say \"due\" because it's a mere suggestion or reminder."
p "I can choose to ignore for now and get back to it later." 
nap
#p "If I ignore it for now, I will be notified again later." 
p
nap
#p "But the reminders will be become increasingly disruptive\n
#the more I ignore it. This is by design and intentional." 
#nap
#p "It's a way of priming up myself to do something I feel" 
#p "a bit reluctant or lazy to do at the moment." 
#p
#nap
#p "There are cases where I have something else to do,\n
#so to stop the nags temporarily, I can click one of the buttons\n
#at the bottom. I can choose 20m, which means do not disturb me\n
#for 20 minutes."
#waitEnter
#p
p "Right now though, I want to read. I will now click the green text."
waitEnter
#clear

p "As you can see, there's some explanation. It's added as a template text. Let me edit real quick."
waitEnter "Enter this text: I have no idea what this book is about,\
I just picked this one randomly from the cluttered library. Goats are also awesome."

p
p "There. Words and all."
p "Scroll down to find the save button."
p "I will ignore the other settings and just go with the defaults."
waitEnter Click save
p "Saved."
nap
p "Enough dilly dallies willy wallies. Click start."
waitEnter Click start
nap
p "It says ongoing, and a gorilla or shark will show up."
p "Now I will open the book and start reading..."
waitEnter "prepare ebook reader before continuing,
also unhide window on OBS"
for i in `seq 1 15`; do
    advanceTime +1min
    sleep 1
done
waitEnter "Wait for textbox to appear before continuing"
p "Time's up! Time flies like bananas."
nap
p "Phew, that was hard. I was a bit distracted,"
nap
p "I was imagining something else while reading."
nap
p "But that's okay, I've done something today, however trivial it was."
p "A journey starts with a single step."
p "I managed to read a book, even for a little bit."
p "I'll somehow do better next time."
p
nap
p "Look, there's now a textbox where I can put some notes in."
p "There's also some tip and note at the bottom on what to write."
p
p "I will write something down real quick."

waitEnter "Write or copy-paste this:

The chapter starts with General Stubblebine, US army's chief of intelligence. He
commands about 16K soldiers. Stubblebine faces decision: to stay in this office or move on to the next office.
Not sure if what the book means here, is it spatial transition from one office to another, or it political,
like a promotion.

Anyways, Stubby muses why we can't dematerialize ourselves and walk through walls.
He went on to visit the Special forces, thinking that those guys mastered the art of material transcendence.
"

p
p "There, all done."
nap
p "Now I'm back at the start."
p "Notice the big green text is gone."
p "Also note there's a time duration when the next goal will be \"due\"."
nap
p "The interval time could be minutes or hours,"
p "depending on how many goals and hours are left for the day."
p
nap
nap
#clear
p "Now I'll sip some coffee for now while procrastinating on HN. And then work on my crappy side project."

waitEnter "
- do not press enter yet
- unhide HN and code windows
- Scroll through an HN page real quick, then show some randome source file.
- then adjust time.
- hide HN and code windows again
- press enter
"

p "Oh how time gorillas, I mean how time flies again."
p "As you can see, there's another big mean green text."
p
p "This time, I'm about to spend some time learning how to draw."
p "My side project is starting to collapse in its own miserable weight,"
p "so what the heck, I rather pick up a pen and draw something crappy."
nap
p "And now I will start practicing how to draw!"
p "I will open up some image editor and draw something awful."
waitEnter "click start, unhide gimp window and goat pic"
for i in `seq 1 15`; do
    advanceTime +1min
    sleep 1
done
waitEnter
p "There. I feel like I committed a crime against humanity,"
p "but no, I only drew a picture of a goat."
p "If picture is worth a thousand words,"
p "then my drawing could be reciting an eternal monologue,"
p "pleading with mercy that its existence be undone and forgotten,"
p "back to the nothingness from whence it came,"
p "to the place of which no conciousness can reach."
waitEnter "Close gimp, and goat pic"
p "I mean, there done for the day."
p
p "I hope this video demonstrated how to use catchsup."

restoreTime
p THE END

