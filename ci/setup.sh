#! /bin/bash

echo "Testing for go-task"
#test for platform tools
if ! command -v task &> /dev/null
then
  echo "You must install go-task: from https://taskfile.dev/installation/"
  exit 1
fi

echo "Testing for cmake"
#test for cmake
if ! command -v cmake &> /dev/null
then
  echo "You must have cmake installed globally"
  exit 1
fi

echo "Testing for GNUMake"
#test for make
if ! command -v make &> /dev/null
then
  echo "You must have GNUMake installed globally"
  exit 1
fi

echo "Testing for git"
#test for git
if ! command -v git &> /dev/null
then
  echo "You must have git installed globally"
  exit 1
fi

#build the argon2 native library
pushd argon2 > /dev/null
echo "Building Argon2 native library"
make
argon2_path=$(find "$(pwd)" -iname "libargon2.so.*")

echo "Add the following environment variable"
echo VNLIB_ARGON2_DLL_PATH=$argon2_path
popd > /dev/null

#build the vnlib_compress native library
pushd vnlib_compress > /dev/null
echo "Building vnlib_compress native library"
task
echo "Finished building vnlib_compress"
popd > /dev/null