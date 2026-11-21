#!/bin/bash
cd /home/hatch/workspace/repos/makefun-entries/sokoban-solver-01-run-20261121
rm -rf /tmp/out2
for n in 001 002 003 004 005; do
  MAKEFUN_INPUT_DIR=/tmp/in$n MAKEFUN_OUTPUT_DIR=/tmp/out2 node main.ts || echo FAIL $n
done
echo "exit $?"
ls /tmp/out2
cat /tmp/out2/*/solution.txt > /tmp/rooms2.txt 2>/tmp/roomserr.txt
