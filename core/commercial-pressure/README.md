# Commercial Pressure

Commercial pressure is a downstream sales-prioritization layer.

It consumes the compressed opportunity and lead facts, then outputs:

- `painScore`: likelihood the business feels a real problem
- `buyingLikelihood`: likelihood the business is reachable and likely to care
- `callPriority`: operator routing label (`high`, `medium`, `low`, `verify`)
- `salesEase`: expected difficulty of the first sales motion
- `commercialPressureReasons`: deterministic reasons behind the pressure score

This layer is not an audit. It answers: who deserves operator attention first?

## Calibration Notes

`callPriority: high` is reserved for leads that are worth operator attention before most others. It should not mean merely that an opportunity exists.

Current calibration principles:

- Contactability improves sales ease, but it does not create HIGH priority without clear pain.
- `technical_trust_risk` is the strongest HIGH pattern, but trades/restaurants with mature contact paths require stronger technical pain before becoming HIGH.
- `high_value_service_conversion` plus strong contact maturity is usually MEDIUM, not HIGH.
- Mature or polished law firms are usually LOW/MEDIUM unless technical trust pain, identity confusion, or visible friction is severe.
- Restaurants stay LOW/MEDIUM by default unless severe technical trust pain is present.

The post-CTA calibration retune moved the 23-lead reviewed batch from `High: 8, Medium: 7, Low: 7, Verify: 1` to `High: 2, Medium: 12, Low: 8, Verify: 1`, retaining only the two clear KEEP HIGH examples.
