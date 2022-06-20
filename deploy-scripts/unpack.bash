#!/bin/bash

unzip 'Legendary Interpolation-20220615T123808Z-001.zip'
unzip 'Legendary Survival-20220615T123003Z-001.zip'
unzip 'Legendary Survival-20220615T123003Z-002.zip'
unzip 'Rare Stills-20220617T141743Z-001.zip'

mv 'Legendary_ Interpolation' interpolation
mv 'Legendary_ Survival' survival
mv 'Rare_ Stills' ai-herbarium

cd survival
ls | xargs -i'{}' mv {} survival-{}
cd ..

cd interpolation
mv '001. trip11.mp4' 001.mp4
mv '002. trip10.mp4' 002.mp4
ls | xargs -i'{}' mv {} interpolation-{}
cd ..

cd ai-herbarium
ls | xargs -i'{}' mv {} ai-herbarium-{}
cd ..
