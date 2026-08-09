# Insurance UI audit

| Route / area           | Issue                                 | I8 change                                                                                           |
| ---------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `/insurance`           | Sparse entry screen                   | Added a Setu-aligned hero, journey explanation, factual trust language, and real policy-type cards. |
| `/account/insurance`   | Reused landing screen                 | Added a customer dashboard driven by assessments, quote requests, and saved quotes.                 |
| `/insurance/needs/:id` | Route was absent despite existing API | Added saveable section wizard using the existing needs APIs.                                        |
| Review / consent       | No customer review screen             | Added review, disclosures, required consent, submission, and quote-request handoff.                 |
| Quote requests         | List lacked request IDs               | Added minimal API response ID so the UI can open details/comparison.                                |
| Quote detail           | Route was absent                      | Added private detail presentation using existing quote detail data.                                 |
| Admin operations       | Raw structured detail emphasis        | Existing I7 routes retained; further dense action UI remains a follow-up.                           |
