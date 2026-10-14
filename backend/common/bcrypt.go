package common

import (
	"fmt"

	"golang.org/x/crypto/bcrypt"
)

var PasswordHashCost = 12

// CheckPasswordHash compare password with hash
func CheckPasswordHash(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

// dummyHash is compared when no account matches, so a failed sign-in takes as long
// for an unknown email as for a wrong password (timing would reveal which emails exist)
var dummyHash, _ = bcrypt.GenerateFromPassword([]byte("no account has this password"), PasswordHashCost)

// SpendPasswordCheck does the work of one password check against nothing.
func SpendPasswordCheck(password string) {
	_ = bcrypt.CompareHashAndPassword(dummyHash, []byte(password))
}

// HashPassword generates a hashed password from a plaintext string
func HashPassword(password string) (string, error) {
	pw, err := bcrypt.GenerateFromPassword([]byte(password), PasswordHashCost)
	if err != nil {
		return "", err
	}
	return string(pw), nil
}

func MustHashPassword(password string) string {
	pw, err := bcrypt.GenerateFromPassword([]byte(password), PasswordHashCost)
	if err != nil {
		panic(fmt.Errorf("MustHashPassword failed: %v", err))
	}
	return string(pw)
}
