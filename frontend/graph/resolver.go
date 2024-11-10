package graph

import (
	collectormetrics "github.com/odigos-io/odigos/frontend/endpoints/collector_metrics"
	"github.com/odigos-io/odigos/frontend/graph/model"
)

// This file will not be regenerated automatically.
// It serves as dependency injection for your app, add any dependencies you require here.

type Resolver struct {
	MetricsConsumer *collectormetrics.OdigosMetricsConsumer
	Trades          []*model.TradeData
}

func (r *Resolver) GenerateTradeData() *model.TradeData {
	return &model.TradeData{
		Symbol:    "DELTA",
		LastPrice: 10,
		Volume:    10,
		High:      10,
		Low:       10,
	}
}
