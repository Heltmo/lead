# Commercial Pressure

Commercial pressure is a downstream sales-prioritization layer.

It consumes the compressed opportunity and lead facts, then outputs:

- `painScore`: likelihood the business feels a real problem
- `buyingLikelihood`: likelihood the business is reachable and likely to care
- `callPriority`: operator routing label (`high`, `medium`, `low`, `verify`)
- `salesEase`: expected difficulty of the first sales motion
- `commercialPressureReasons`: deterministic reasons behind the pressure score

This layer is not an audit. It answers: who deserves operator attention first?
