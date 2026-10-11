package loggedmodule

type Name string

const (
	AdminRequests Name = "admin:requests"
	Transfers     Name = "transfers"
	Marks         Name = "marks"
	Comms         Name = "comms"
	Accounts      Name = "accounts"
)
