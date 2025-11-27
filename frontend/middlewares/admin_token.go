package middlewares

import (
	"crypto/ed25519"
	"encoding/base64"
	"encoding/json"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/odigos-io/odigos/frontend/services"
)

const (
	adminTokenHeader   = "X-Odigos-Admin-Token"
	adminPubKeyHeader  = "X-Odigos-Admin-PubKey"
	requiredPermission = "override-readonly"
)

type adminClaims struct {
	Cluster     string   `json:"cluster"`
	UserID      string   `json:"userId"`
	Iat         int64    `json:"iat"`
	Exp         int64    `json:"exp"`
	Permissions []string `json:"permissions"`
}

var (
	adminPubKey     ed25519.PublicKey
	adminPubKeyOnce sync.Once
)

func loadAdminPubKeyFromHeaderIfNeeded(pubKeyHeader string) error {
	var err error
	adminPubKeyOnce.Do(func() {
		if pubKeyHeader == "" {
			err = &headerError{"empty pubkey header"}
			return
		}
		b, decodeErr := base64.RawStdEncoding.DecodeString(pubKeyHeader)
		if decodeErr != nil {
			err = decodeErr
			return
		}
		adminPubKey = ed25519.PublicKey(b)
	})
	return err
}

type headerError struct{ msg string }

func (e *headerError) Error() string { return e.msg }

func AdminTokenMiddleware(clusterName string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Only evaluate admin override when the local UI is in readonly mode
		if !services.IsReadonlyMode(c.Request.Context()) {
			c.Next()
			return
		}

		if adminPubKey == nil {
			if pubKeyHeader := c.GetHeader(adminPubKeyHeader); pubKeyHeader != "" {
				_ = loadAdminPubKeyFromHeaderIfNeeded(pubKeyHeader)
			}
		}

		token := c.GetHeader(adminTokenHeader)
		if token == "" || adminPubKey == nil {
			c.Next()
			return
		}

		if ok := verifyAdminToken(token, adminPubKey, clusterName); !ok {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "invalid admin token"})
			return
		}

		ctx := WithAdminOverride(c.Request.Context())
		c.Request = c.Request.WithContext(ctx)
		c.Next()
	}
}

func verifyAdminToken(token string, pubKey ed25519.PublicKey, clusterName string) bool {
	parts := strings.Split(token, ".")
	if len(parts) != 3 {
		return false
	}
	headerPart := parts[0]
	payloadPart := parts[1]
	sigPart := parts[2]

	headerBytes, err := base64.RawURLEncoding.DecodeString(headerPart)
	if err != nil {
		return false
	}
	var header map[string]any
	if err := json.Unmarshal(headerBytes, &header); err != nil {
		return false
	}
	if alg, _ := header["alg"].(string); alg != "EdDSA" {
		return false
	}

	sig, err := base64.RawURLEncoding.DecodeString(sigPart)
	if err != nil {
		return false
	}
	signingInput := []byte(headerPart + "." + payloadPart)
	if !ed25519.Verify(pubKey, signingInput, sig) {
		return false
	}

	payloadBytes, err := base64.RawURLEncoding.DecodeString(payloadPart)
	if err != nil {
		return false
	}
	var claims adminClaims
	if err := json.Unmarshal(payloadBytes, &claims); err != nil {
		return false
	}

	now := time.Now().Unix()
	if claims.Iat > now || claims.Exp < now {
		return false
	}
	if claims.Cluster != "" && clusterName != "" && claims.Cluster != clusterName {
		return false
	}
	for _, p := range claims.Permissions {
		if p == requiredPermission {
			return true
		}
	}
	return false
}
