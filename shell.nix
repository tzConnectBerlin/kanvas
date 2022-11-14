{ pkgs ? import <nixpkgs> {} }:
with pkgs;

let

in mkShell {
  buildInputs = [
    yarn
    nodejs-18_x
    ffmpeg
  ];
}
