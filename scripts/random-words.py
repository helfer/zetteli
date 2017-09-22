import sys, os, random

words = []

with open(sys.argv[1]) as f:
    for line in f.readlines():
        words.append(line.strip())

    words = words[:4096]
    print words

    for i in range(0, 10):
        print "-".join(map(lambda j: random.choice(words), range(0, int(sys.argv[2]))))

