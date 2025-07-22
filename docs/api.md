---
title: Overview
---

This page describes how to perform common operations with the REST API. Each endpoint is documented individually and grouped by the resource it interacts with, such as [Transcripts](/docs/api-reference/transcripts) and [LeMUR](/docs/api-reference/lemur).

The AssemblyAI API uses [REST](https://en.wikipedia.org/wiki/REST) with [JSON-encoded](https://www.json.org/json-en.html) request bodies and responses, and is available at the following URL:

```plain title="Base URL"
https://api.assemblyai.com
```

<Note>
  To use our EU servers, replace `api.assemblyai.com` with
  `api.eu.assemblyai.com`. The EU endpoint is available for **Async STT** and **LeMUR**. **Streaming STT** is not currently supported.
</Note>

<Info title="Streaming Speech-to-Text">
  This page explains the AssemblyAI REST API. If you want to use Streaming
  Speech-to-Text, see [Streaming API reference](/docs/api-reference/streaming-api/streaming-api).
</Info>

## Client SDKs

AssemblyAI provides official SDKs for popular programming languages, that make it simpler to interact with the API.

To get started using the SDKs, see the following resources:

- [Transcribe an audio file](https://www.assemblyai.com/docs/getting-started/transcribe-an-audio-file)
- [Apply LLMs to audio files using LeMUR](https://www.assemblyai.com/docs/lemur/apply-llms-to-audio-files).

## Authorization

To make authorized calls the REST API, your app must provide an authorization header with an API key. You can find your API key in the [AssemblyAI dashboard](https://www.assemblyai.com/app/api-keys).

```bash title="Authenticated request"
curl https://api.assemblyai.com/v2/transcript \
  --header 'Authorization: <YOUR_API_KEY>'
```

<Info title="Your API key">
The examples here contain a placeholder, `<YOUR_API_KEY>`, that you need to replace with your actual API key.
</Info>

## Errors

The AssemblyAI API uses HTTP response codes to indicate whether a request was successful.

The response codes generally fall into the following ranges:

- `2xx` indicates the request was successful.
- `4xx` indicates the request may have omitted a required parameter, or have invalid information.
- `5xx` indicates an error on AssemblyAI's end.

Below is a summary of the HTTP response codes you may encounter:

| Code          | Status            | Description                                                                                  |
| ------------- | ----------------- | -------------------------------------------------------------------------------------------- |
| 200           | OK                | Request was successful.                                                                      |
| 400           | Bad request       | The request failed due to an invalid request.                                                |
| 401           | Unauthorized      | Missing or invalid API key.                                                                  |
| 404           | Not found         | The requested resource doesn't exist.                                                        |
| 429           | Too many requests | Too many request were sent to the API. See [Rate limits](#rate-limits) for more information. |
| 500, 503, 504 | Server error      | Something went wrong on AssemblyAI's end.                                                    |

```json title="Response with error"
{
  "error": "Authentication error, API token missing/invalid"
}
```

<Tip title="API status">
  To stay up-to-date with any known service disruptions, subscribe to updates on
  the [Status](https://status.assemblyai.com) page.
</Tip>

### Failed transcriptions

Transcriptions may fail due to errors while processing the audio data.

When you query a transcription that has failed, the response will have a `200` code, along with `status` set to `error` and an `error` property with more details.

```json title="Failed transcription"
{
    "status": "error",
    "error": "Download error to https://foo.bar, 403 Client Error: Forbidden for url: https://foo.bar",
    ...
}
```

Common reasons why a transcription may fail include:

- Audio data is corrupted or in an unsupported format. See [FAQ](https://www.assemblyai.com/docs/concepts/faq) for supported formats.
- Audio URL is a webpage rather than a file.
- Audio URL isn't accessible from AssemblyAI's servers.
- Audio duration is too short (less than 160ms).

In the rare event of a transcription failure due to a server error, you may resubmit the file for transcription. If the problems persist after resubmitting, [let us know](mailto:support@assemblyai.com).

## Rate limits

To ensure the LeMUR API remains available for all users, you can only make a limited number of requests within a 60-second time window. Only LeMUR requests are rate limited.

If you exceed the limit, the API will respond with a `429` status code.

To see your remaining quota, check the following response headers:

| Header                  | Description                                                                                |
| ----------------------- | ------------------------------------------------------------------------------------------ |
| `X-RateLimit-Limit`     | Maximum number of allowed requests in a 60 second window.                                  |
| `X-RateLimit-Remaining` | Number of remaining requests in the current time window.                                   |
| `X-RateLimit-Reset`     | Number of seconds until the remaining requests resets to the value of `X-RateLimit-Limit`. |

If the response doesn't include `X-RateLimit` headers, the endpoint doesn't have rate limits.

<Info title="Increasing rate limits">
  If you want to increase the rate limit for your account, [contact
  us](mailto:support@assemblyai.com).
</Info>

## Pagination

Endpoints that support listing multiple resources use pagination to limit the number of results returned in a single response.

Paginated responses include a `page_details` JSON object with information about the results and links to navigate between pages.

| Property                       | Description                            |
| ------------------------------ | -------------------------------------- |
| `page_details[i].limit`        | Maximum number of resources in a page. |
| `page_details[i].result_count` | Total number of available resources.   |
| `page_details[i].current_url`  | URL to the current page.               |
| `page_details[i].prev_url`     | URL to the previous page.              |
| `page_details[i].next_url`     | URL to the next page.                  |

```json title="Paginated response"
{
  "page_details": {
    "limit": 1,
    "result_count": 1,
    "current_url": "https://api.assemblyai.com/v2/transcript?limit=1",
    "prev_url": "https://api.assemblyai.com/v2/transcript?limit=1&before_id=bfc3622e-8c69-4497-9a84-fb65b30dcb07",
    "next_url": "https://api.assemblyai.com/v2/transcript?limit=1&after_id=bfc3622e-8c69-4497-9a84-fb65b30dcb07"
  },
  "transcripts": [
    {
      // ...
    }
  ]
}
```

## Versioning

When AssemblyAI makes backwards-incompatible changes to the API, we release a new version. For information on API updates, see [Changelog](https://www.assemblyai.com/changelog).

Endpoints are versioned using a path prefix, such as `/v2`.


API Reference
Files
Upload a media file
POST
https://api.assemblyai.com/v2/upload
POST
/v2/upload

curl -X POST https://api.assemblyai.com/v2/upload \
     -H "Authorization: <apiKey>" \
     -H "Content-Type: application/octet-stream" \
     --data-binary @path/to/file
Try it
200
Successful

{
  "upload_url": "https://cdn.assemblyai.com/upload/f756988d-47e2-4ca3-96ce-04bb168f8f2a"
}
To upload a media file to our EU server, replace api.assemblyai.com with api.eu.assemblyai.com.
Upload a media file to AssemblyAI’s servers.

Headers
Authorization
string
Required
Request
This endpoint expects binary data of type application/octet-stream.
Response
Media file uploaded successfully
upload_url
string
format: "url"
A URL that points to your audio file, accessible only by AssemblyAI's servers
Errors

400
Bad Request Error

401
Unauthorized Error

404
Not Found Error

429
Too Many Requests Error

500
Internal Server Error

503
Service Unavailable Error

504
Gateway Timeout Error
Was this page helpful?
Yes
No
Previous
Transcribe audio
Next
Built with



Logo
Search
/
Sign In

API Reference
Overview

Files
POST
Upload a media file

Transcripts
POST
Transcribe audio
GET
Get transcript
GET
Get sentences in transcript
GET
Get paragraphs in transcript
GET
Get subtitles for transcript
GET
Get redacted audio
GET
Search words in transcript
GET
List transcripts
DEL
Delete transcript

LeMUR

Streaming API
API Reference
Transcripts
Transcribe audio
POST
https://api.assemblyai.com/v2/transcript
POST
/v2/transcript

curl -X POST https://api.assemblyai.com/v2/transcript \
     -H "Authorization: <apiKey>" \
     -H "Content-Type: application/json" \
     -d '{
  "audio_url": "https://assembly.ai/wildfires.mp3",
  "audio_end_at": 280,
  "audio_start_from": 10,
  "auto_chapters": true,
  "auto_highlights": true,
  "boost_param": "high",
  "content_safety": true,
  "custom_spelling": [],
  "disfluencies": false,
  "entity_detection": true,
  "filter_profanity": true,
  "format_text": true,
  "iab_categories": true,
  "language_code": "en_us",
  "language_confidence_threshold": 0.7,
  "language_detection": true,
  "multichannel": true,
  "punctuate": true,
  "redact_pii": true,
  "redact_pii_audio": true,
  "redact_pii_audio_quality": "mp3",
  "redact_pii_policies": [
    "us_social_security_number",
    "credit_card_number"
  ],
  "redact_pii_sub": "hash",
  "sentiment_analysis": true,
  "speaker_labels": true,
  "speakers_expected": 2,
  "speech_threshold": 0.5,
  "summarization": true,
  "summary_model": "informative",
  "summary_type": "bullets",
  "topics": [],
  "webhook_auth_header_name": "webhook-secret",
  "webhook_auth_header_value": "webhook-secret-value",
  "webhook_url": "https://your-webhook-url/path",
  "custom_topics": true,
  "dual_channel": false,
  "word_boost": [
    "aws",
    "azure",
    "google cloud"
  ]
}'
Try it
200
Successful

{
  "id": "9ea68fd3-f953-42c1-9742-976c447fb463",
  "audio_url": "https://assembly.ai/wildfires.mp3",
  "status": "completed",
  "language_confidence_threshold": 0.7,
  "language_confidence": 0.9959,
  "speech_model": null,
  "webhook_auth": true,
  "auto_highlights": true,
  "redact_pii": true,
  "summarization": true,
  "language_model": "assemblyai_default",
  "acoustic_model": "assemblyai_default",
  "language_code": "en_us",
  "language_detection": true,
  "text": "Smoke from hundreds of wildfires in Canada is triggering air quality alerts throughout the US. Skylines from Maine to Maryland to Minnesota are gray and smoggy. And in some places, the air quality warnings include the warning to stay inside. We wanted to better understand what's happening here and why, so we called Peter de Carlo, an associate professor in the Department of Environmental Health and Engineering at Johns Hopkins University Varsity. Good morning, professor. Good morning. What is it about the conditions right now that have caused this round of wildfires to affect so many people so far away? Well, there's a couple of things. The season has been pretty dry already. And then the fact that we're getting hit in the US. Is because there's a couple of weather systems that are essentially channeling the smoke from those Canadian wildfires through Pennsylvania into the Mid Atlantic and the Northeast and kind of just dropping the smoke there. So what is it in this haze that makes it harmful? And I'm assuming it is harmful. It is. The levels outside right now in Baltimore are considered unhealthy. And most of that is due to what's called particulate matter, which are tiny particles, microscopic smaller than the width of your hair that can get into your lungs and impact your respiratory system, your cardiovascular system, and even your neurological your brain. What makes this particularly harmful? Is it the volume of particulant? Is it something in particular? What is it exactly? Can you just drill down on that a little bit more? Yeah. So the concentration of particulate matter I was looking at some of the monitors that we have was reaching levels of what are, in science, big 150 micrograms per meter cubed, which is more than ten times what the annual average should be and about four times higher than what you're supposed to have on a 24 hours average. And so the concentrations of these particles in the air are just much, much higher than we typically see. And exposure to those high levels can lead to a host of health problems. And who is most vulnerable? I noticed that in New York City, for example, they're canceling outdoor activities. And so here it is in the early days of summer, and they have to keep all the kids inside. So who tends to be vulnerable in a situation like this? It's the youngest. So children, obviously, whose bodies are still developing. The elderly, who are their bodies are more in decline and they're more susceptible to the health impacts of breathing, the poor air quality. And then people who have preexisting health conditions, people with respiratory conditions or heart conditions can be triggered by high levels of air pollution. Could this get worse? That's a good question. In some areas, it's much worse than others. And it just depends on kind of where the smoke is concentrated. I think New York has some of the higher concentrations right now, but that's going to change as that air moves away from the New York area. But over the course of the next few days, we will see different areas being hit at different times with the highest concentrations. I was going to ask you about more fires start burning. I don't expect the concentrations to go up too much higher. I was going to ask you how and you started to answer this, but how much longer could this last? Or forgive me if I'm asking you to speculate, but what do you think? Well, I think the fires are going to burn for a little bit longer, but the key for us in the US. Is the weather system changing. And so right now, it's kind of the weather systems that are pulling that air into our mid Atlantic and Northeast region. As those weather systems change and shift, we'll see that smoke going elsewhere and not impact us in this region as much. And so I think that's going to be the defining factor. And I think the next couple of days we're going to see a shift in that weather pattern and start to push the smoke away from where we are. And finally, with the impacts of climate change, we are seeing more wildfires. Will we be seeing more of these kinds of wide ranging air quality consequences or circumstances? I mean, that is one of the predictions for climate change. Looking into the future, the fire season is starting earlier and lasting longer, and we're seeing more frequent fires. So, yeah, this is probably something that we'll be seeing more frequently. This tends to be much more of an issue in the Western US. So the eastern US. Getting hit right now is a little bit new. But yeah, I think with climate change moving forward, this is something that is going to happen more frequently. That's Peter De Carlo, associate professor in the Department of Environmental Health and Engineering at Johns Hopkins University. Sergeant Carlo, thanks so much for joining us and sharing this expertise with us. Thank you for having me.",
  "words": [
    {
      "confidence": 0.97465,
      "start": 250,
      "end": 650,
      "text": "Smoke",
      "speaker": null
    },
    {
      "confidence": 0.99999,
      "start": 730,
      "end": 1022,
      "text": "from",
      "speaker": null
    },
    {
      "confidence": 0.99844,
      "start": 1076,
      "end": 1418,
      "text": "hundreds",
      "speaker": null
    },
    {
      "confidence": 0.84,
      "start": 1434,
      "end": 1614,
      "text": "of",
      "speaker": null
    },
    {
      "confidence": 0.89572,
      "start": 1652,
      "end": 2346,
      "text": "wildfires",
      "speaker": null
    },
    {
      "confidence": 0.99994,
      "start": 2378,
      "end": 2526,
      "text": "in",
      "speaker": null
    },
    {
      "confidence": 0.93953,
      "start": 2548,
      "end": 3130,
      "text": "Canada",
      "speaker": null
    },
    {
      "confidence": 0.999,
      "start": 3210,
      "end": 3454,
      "text": "is",
      "speaker": null
    },
    {
      "confidence": 0.74794,
      "start": 3492,
      "end": 3946,
      "text": "triggering",
      "speaker": null
    },
    {
      "confidence": 1,
      "start": 3978,
      "end": 4174,
      "text": "air",
      "speaker": null
    },
    {
      "confidence": 0.88077,
      "start": 4212,
      "end": 4558,
      "text": "quality",
      "speaker": null
    },
    {
      "confidence": 0.94814,
      "start": 4644,
      "end": 5114,
      "text": "alerts",
      "speaker": null
    },
    {
      "confidence": 0.99726,
      "start": 5162,
      "end": 5466,
      "text": "throughout",
      "speaker": null
    },
    {
      "confidence": 0.79,
      "start": 5498,
      "end": 5694,
      "text": "the",
      "speaker": null
    },
    {
      "confidence": 0.89,
      "start": 5732,
      "end": 6382,
      "text": "US.",
      "speaker": null
    }
  ],
  "utterances": [
    {
      "confidence": 0.9359033333333334,
      "start": 250,
      "end": 26950,
      "text": "Smoke from hundreds of wildfires in Canada is triggering air quality alerts throughout the US. Skylines from Maine to Maryland to Minnesota are gray and smoggy. And in some places, the air quality warnings include the warning to stay inside. We wanted to better understand what's happening here and why, so we called Peter de Carlo, an associate professor in the Department of Environmental Health and Engineering at Johns Hopkins University Varsity. Good morning, professor.",
      "words": [
        {
          "confidence": 0.97503,
          "start": 250,
          "end": 650,
          "text": "Smoke",
          "speaker": "A"
        },
        {
          "confidence": 0.99999,
          "start": 730,
          "end": 1022,
          "text": "from",
          "speaker": "A"
        },
        {
          "confidence": 0.99843,
          "start": 1076,
          "end": 1418,
          "text": "hundreds",
          "speaker": "A"
        },
        {
          "confidence": 0.85,
          "start": 1434,
          "end": 1614,
          "text": "of",
          "speaker": "A"
        },
        {
          "confidence": 0.89657,
          "start": 1652,
          "end": 2346,
          "text": "wildfires",
          "speaker": "A"
        },
        {
          "confidence": 0.99994,
          "start": 2378,
          "end": 2526,
          "text": "in",
          "speaker": "A"
        },
        {
          "confidence": 0.93864,
          "start": 2548,
          "end": 3130,
          "text": "Canada",
          "speaker": "A"
        },
        {
          "confidence": 0.999,
          "start": 3210,
          "end": 3454,
          "text": "is",
          "speaker": "A"
        },
        {
          "confidence": 0.75366,
          "start": 3492,
          "end": 3946,
          "text": "triggering",
          "speaker": "A"
        },
        {
          "confidence": 1,
          "start": 3978,
          "end": 4174,
          "text": "air",
          "speaker": "A"
        },
        {
          "confidence": 0.87745,
          "start": 4212,
          "end": 4558,
          "text": "quality",
          "speaker": "A"
        },
        {
          "confidence": 0.94739,
          "start": 4644,
          "end": 5114,
          "text": "alerts",
          "speaker": "A"
        },
        {
          "confidence": 0.99726,
          "start": 5162,
          "end": 5466,
          "text": "throughout",
          "speaker": "A"
        },
        {
          "confidence": 0.79,
          "start": 5498,
          "end": 5694,
          "text": "the",
          "speaker": "A"
        },
        {
          "confidence": 0.88,
          "start": 5732,
          "end": 6382,
          "text": "US.",
          "speaker": "A"
        }
      ],
      "speaker": "A"
    }
  ],
  "confidence": 0.9404651451800253,
  "audio_duration": 281,
  "punctuate": true,
  "format_text": true,
  "disfluencies": false,
  "multichannel": false,
  "webhook_url": "https://your-webhook-url.tld/path",
  "webhook_status_code": 200,
  "webhook_auth_header_name": "webhook-secret",
  "auto_highlights_result": {
    "status": "success",
    "results": [
      {
        "count": 1,
        "rank": 0.08,
        "text": "air quality alerts",
        "timestamps": [
          {
            "start": 3978,
            "end": 5114
          }
        ]
      },
      {
        "count": 1,
        "rank": 0.08,
        "text": "wide ranging air quality consequences",
        "timestamps": [
          {
            "start": 235388,
            "end": 238694
          }
        ]
      },
      {
        "count": 1,
        "rank": 0.07,
        "text": "more wildfires",
        "timestamps": [
          {
            "start": 230972,
            "end": 232354
          }
        ]
      },
      {
        "count": 1,
        "rank": 0.07,
        "text": "air pollution",
        "timestamps": [
          {
            "start": 156004,
            "end": 156910
          }
        ]
      },
      {
        "count": 3,
        "rank": 0.07,
        "text": "weather systems",
        "timestamps": [
          {
            "start": 47344,
            "end": 47958
          },
          {
            "start": 205268,
            "end": 205818
          },
          {
            "start": 211588,
            "end": 213434
          }
        ]
      },
      {
        "count": 2,
        "rank": 0.06,
        "text": "high levels",
        "timestamps": [
          {
            "start": 121128,
            "end": 121646
          },
          {
            "start": 155412,
            "end": 155866
          }
        ]
      },
      {
        "count": 1,
        "rank": 0.06,
        "text": "health conditions",
        "timestamps": [
          {
            "start": 152138,
            "end": 152666
          }
        ]
      },
      {
        "count": 2,
        "rank": 0.06,
        "text": "Peter de Carlo",
        "timestamps": [
          {
            "start": 18948,
            "end": 19930
          },
          {
            "start": 268298,
            "end": 269194
          }
        ]
      },
      {
        "count": 1,
        "rank": 0.06,
        "text": "New York City",
        "timestamps": [
          {
            "start": 125768,
            "end": 126274
          }
        ]
      },
      {
        "count": 1,
        "rank": 0.05,
        "text": "respiratory conditions",
        "timestamps": [
          {
            "start": 152964,
            "end": 153786
          }
        ]
      },
      {
        "count": 3,
        "rank": 0.05,
        "text": "New York",
        "timestamps": [
          {
            "start": 125768,
            "end": 126034
          },
          {
            "start": 171448,
            "end": 171938
          },
          {
            "start": 176008,
            "end": 176322
          }
        ]
      },
      {
        "count": 3,
        "rank": 0.05,
        "text": "climate change",
        "timestamps": [
          {
            "start": 229548,
            "end": 230230
          },
          {
            "start": 244576,
            "end": 245162
          },
          {
            "start": 263348,
            "end": 263950
          }
        ]
      },
      {
        "count": 1,
        "rank": 0.05,
        "text": "Johns Hopkins University Varsity",
        "timestamps": [
          {
            "start": 23972,
            "end": 25490
          }
        ]
      },
      {
        "count": 1,
        "rank": 0.05,
        "text": "heart conditions",
        "timestamps": [
          {
            "start": 153988,
            "end": 154506
          }
        ]
      },
      {
        "count": 1,
        "rank": 0.05,
        "text": "air quality warnings",
        "timestamps": [
          {
            "start": 12308,
            "end": 13434
          }
        ]
      }
    ]
  },
  "audio_start_from": 10,
  "audio_end_at": 280,
  "boost_param": "high",
  "filter_profanity": true,
  "redact_pii_audio": true,
  "redact_pii_audio_quality": "mp3",
  "redact_pii_policies": [
    "us_social_security_number",
    "credit_card_number"
  ],
  "redact_pii_sub": "hash",
  "speaker_labels": true,
  "speakers_expected": 2,
  "content_safety": true,
  "content_safety_labels": {
    "status": "success",
    "results": [
      {
        "text": "Smoke from hundreds of wildfires in Canada is triggering air quality alerts throughout the US. Skylines from Maine to Maryland to Minnesota are gray and smoggy. And in some places, the air quality warnings include the warning to stay inside. We wanted to better understand what's happening here and why, so we called Peter de Carlo, an associate professor in the Department of Environmental Health and Engineering at Johns Hopkins University Varsity. Good morning, professor. Good morning.",
        "labels": [
          {
            "label": "disasters",
            "confidence": 0.8142836093902588,
            "severity": 0.4093044400215149
          }
        ],
        "sentences_idx_start": 0,
        "sentences_idx_end": 5,
        "timestamp": {
          "start": 250,
          "end": 28840
        }
      }
    ],
    "summary": {
      "disasters": 0.9940800441842205,
      "health_issues": 0.9216489289040967
    },
    "severity_score_summary": {
      "disasters": {
        "low": 0.5733263024656846,
        "medium": 0.42667369753431533,
        "high": 0
      },
      "health_issues": {
        "low": 0.22863814977924785,
        "medium": 0.45014154926938227,
        "high": 0.32122030095136983
      }
    }
  },
  "iab_categories": true,
  "iab_categories_result": {
    "status": "success",
    "results": [
      {
        "text": "Smoke from hundreds of wildfires in Canada is triggering air quality alerts throughout the US. Skylines from Maine to Maryland to Minnesota are gray and smoggy. And in some places, the air quality warnings include the warning to stay inside. We wanted to better understand what's happening here and why, so we called Peter de Carlo, an associate professor in the Department of Environmental Health and Engineering at Johns Hopkins University Varsity. Good morning, professor. Good morning.",
        "labels": [
          {
            "relevance": 0.988274097442627,
            "label": "Home&Garden>IndoorEnvironmentalQuality"
          },
          {
            "relevance": 0.5821335911750793,
            "label": "NewsAndPolitics>Weather"
          },
          {
            "relevance": 0.0042327106930315495,
            "label": "MedicalHealth>DiseasesAndConditions>LungAndRespiratoryHealth"
          },
          {
            "relevance": 0.0033971222583204508,
            "label": "NewsAndPolitics>Disasters"
          },
          {
            "relevance": 0.002469958271831274,
            "label": "BusinessAndFinance>Business>GreenSolutions"
          },
          {
            "relevance": 0.0014376690378412604,
            "label": "MedicalHealth>DiseasesAndConditions>Cancer"
          },
          {
            "relevance": 0.0014294233405962586,
            "label": "Science>Environment"
          },
          {
            "relevance": 0.001234519761055708,
            "label": "Travel>TravelLocations>PolarTravel"
          },
          {
            "relevance": 0.0010231725173071027,
            "label": "MedicalHealth>DiseasesAndConditions>ColdAndFlu"
          },
          {
            "relevance": 0.0007445293595083058,
            "label": "BusinessAndFinance>Industries>PowerAndEnergyIndustry"
          }
        ],
        "timestamp": {
          "start": 250,
          "end": 28840
        }
      }
    ],
    "summary": {
      "NewsAndPolitics>Weather": 1,
      "Home&Garden>IndoorEnvironmentalQuality": 0.9043831825256348,
      "Science>Environment": 0.16117265820503235,
      "BusinessAndFinance>Industries>EnvironmentalServicesIndustry": 0.14393523335456848,
      "MedicalHealth>DiseasesAndConditions>LungAndRespiratoryHealth": 0.11401086300611496,
      "BusinessAndFinance>Business>GreenSolutions": 0.06348437070846558,
      "NewsAndPolitics>Disasters": 0.05041387677192688,
      "Travel>TravelLocations>PolarTravel": 0.01308488193899393,
      "HealthyLiving": 0.008222488686442375,
      "MedicalHealth>DiseasesAndConditions>ColdAndFlu": 0.0022315620444715023,
      "MedicalHealth>DiseasesAndConditions>HeartAndCardiovascularDiseases": 0.00213034451007843,
      "HealthyLiving>Wellness>SmokingCessation": 0.001540527562610805,
      "MedicalHealth>DiseasesAndConditions>Injuries": 0.0013950627762824297,
      "BusinessAndFinance>Industries>PowerAndEnergyIndustry": 0.0012570273829624057,
      "MedicalHealth>DiseasesAndConditions>Cancer": 0.001097781932912767,
      "MedicalHealth>DiseasesAndConditions>Allergies": 0.0010148967849090695,
      "MedicalHealth>DiseasesAndConditions>MentalHealth": 0.000717321818228811,
      "Style&Fashion>PersonalCare>DeodorantAndAntiperspirant": 0.0006022014422342181,
      "Technology&Computing>Computing>ComputerNetworking": 0.0005461975233629346,
      "MedicalHealth>DiseasesAndConditions>Injuries>FirstAid": 0.0004885646631009877
    }
  },
  "auto_chapters": true,
  "chapters": [
    {
      "gist": "Smoggy air quality alerts across US",
      "headline": "Smoke from hundreds of wildfires in Canada is triggering air quality alerts across US",
      "summary": "Smoke from hundreds of wildfires in Canada is triggering air quality alerts throughout the US. Skylines from Maine to Maryland to Minnesota are gray and smoggy. In some places, the air quality warnings include the warning to stay inside.",
      "start": 250,
      "end": 28840
    },
    {
      "gist": "What is it about the conditions right now that have caused this round",
      "headline": "High particulate matter in wildfire smoke can lead to serious health problems",
      "summary": "Air pollution levels in Baltimore are considered unhealthy. Exposure to high levels can lead to a host of health problems. With climate change, we are seeing more wildfires. Will we be seeing more of these kinds of wide ranging air quality consequences?",
      "start": 29610,
      "end": 280340
    }
  ],
  "summary_type": "bullets",
  "summary_model": "informative",
  "summary": "- Smoke from hundreds of wildfires in Canada is triggering air quality alerts throughout the US. Skylines from Maine to Maryland to Minnesota are gray and smoggy. In some places, the air quality warnings include the warning to stay inside.\\n- Air pollution levels in Baltimore are considered unhealthy. Exposure to high levels can lead to a host of health problems. With climate change, we are seeing more wildfires. Will we be seeing more of these kinds of wide ranging air quality consequences?",
  "topics": [],
  "sentiment_analysis": true,
  "entity_detection": true,
  "entities": [
    {
      "entity_type": "location",
      "text": "Canada",
      "start": 2548,
      "end": 3130
    },
    {
      "entity_type": "location",
      "text": "the US",
      "start": 5498,
      "end": 6382
    },
    {
      "entity_type": "location",
      "text": "Maine",
      "start": 7492,
      "end": 7914
    },
    {
      "entity_type": "location",
      "text": "Maryland",
      "start": 8212,
      "end": 8634
    },
    {
      "entity_type": "location",
      "text": "Minnesota",
      "start": 8932,
      "end": 9578
    },
    {
      "entity_type": "person_name",
      "text": "Peter de Carlo",
      "start": 18948,
      "end": 19930
    },
    {
      "entity_type": "occupation",
      "text": "associate professor",
      "start": 20292,
      "end": 21194
    },
    {
      "entity_type": "organization",
      "text": "Department of Environmental Health and Engineering",
      "start": 21508,
      "end": 23706
    },
    {
      "entity_type": "organization",
      "text": "Johns Hopkins University Varsity",
      "start": 23972,
      "end": 25490
    },
    {
      "entity_type": "occupation",
      "text": "professor",
      "start": 26076,
      "end": 26950
    },
    {
      "entity_type": "location",
      "text": "the US",
      "start": 45184,
      "end": 45898
    },
    {
      "entity_type": "nationality",
      "text": "Canadian",
      "start": 49728,
      "end": 50086
    }
  ],
  "speech_threshold": 0.5,
  "dual_channel": false,
  "word_boost": [
    "aws",
    "azure",
    "google cloud"
  ],
  "custom_topics": true
}
To use our EU server for transcription, replace api.assemblyai.com with api.eu.assemblyai.com.
Create a transcript from a media file that is accessible via a URL.

Headers
Authorization
string
Required
Request
Params to create a transcript
audio_url
string
Required
format: "url"
The URL of the audio or video file to transcribe.
audio_end_at
integer
Optional
The point in time, in milliseconds, to stop transcribing in your media file
audio_start_from
integer
Optional
The point in time, in milliseconds, to begin transcribing in your media file
auto_chapters
boolean
Optional
Defaults to false
Enable Auto Chapters, can be true or false

auto_highlights
boolean
Optional
Defaults to false
Enable Key Phrases, either true or false
boost_param
enum
Optional
How much to boost specified words
Allowed values:
low
default
high
content_safety
boolean
Optional
Defaults to false
Enable Content Moderation, can be true or false

content_safety_confidence
integer
Optional
>=25
<=100
Defaults to 50
The confidence threshold for the Content Moderation model. Values must be between 25 and 100.
custom_spelling
list of objects
Optional
Customize how words are spelled and formatted using to and from values

Show 2 properties
disfluencies
boolean
Optional
Defaults to false
Transcribe Filler Words, like “umm”, in your media file; can be true or false

entity_detection
boolean
Optional
Defaults to false
Enable Entity Detection, can be true or false

filter_profanity
boolean
Optional
Defaults to false
Filter profanity from the transcribed text, can be true or false
format_text
boolean
Optional
Defaults to true
Enable Text Formatting, can be true or false
iab_categories
boolean
Optional
Defaults to false
Enable Topic Detection, can be true or false

keyterms_prompt
list of strings
Optional
keyterms_prompt is only supported when the speech_model is specified as slam-1
Improve accuracy with up to 1000 domain-specific words or phrases (maximum 6 words per phrase).

language_code
enum or null
Optional
The language of your audio file. Possible values are found in Supported Languages. The default value is ‘en_us’.


Show 102 enum values
language_confidence_threshold
double
Optional
The confidence threshold for the automatically detected language. An error will be returned if the language confidence is below this threshold. Defaults to 0.
language_detection
boolean
Optional
Defaults to false
Enable Automatic language detection, either true or false.

multichannel
boolean
Optional
Defaults to false
Enable Multichannel transcription, can be true or false.

punctuate
boolean
Optional
Defaults to true
Enable Automatic Punctuation, can be true or false
redact_pii
boolean
Optional
Defaults to false
Redact PII from the transcribed text using the Redact PII model, can be true or false
redact_pii_audio
boolean
Optional
Defaults to false
Generate a copy of the original media file with spoken PII “beeped” out, can be true or false. See PII redaction for more details.

redact_pii_audio_options
object
Optional
Specify options for PII redacted audio files.

Show 1 properties
redact_pii_audio_quality
enum
Optional
Controls the filetype of the audio created by redact_pii_audio. Currently supports mp3 (default) and wav. See PII redaction for more details.

Allowed values:
mp3
wav
redact_pii_policies
list of enums
Optional
The list of PII Redaction policies to enable. See PII redaction for more details.


Show 44 enum values
redact_pii_sub
enum or null
Optional
The replacement logic for detected PII, can be entity_type or hash. See PII redaction for more details.

Allowed values:
entity_name
hash
sentiment_analysis
boolean
Optional
Defaults to false
Enable Sentiment Analysis, can be true or false

speaker_labels
boolean
Optional
Defaults to false
Enable Speaker diarization, can be true or false

speaker_options
object
Optional
Specify options for speaker diarization.

Show 2 properties
speakers_expected
integer or null
Optional
Tells the speaker label model how many speakers it should attempt to identify, up to 10. See Speaker diarization for more details.

speech_model
enum or null
Optional
The speech model to use for the transcription. When null, the universal model is used.

Allowed values:
best
slam-1
universal
speech_threshold
double or null
Optional
Reject audio files that contain less than this fraction of speech. Valid values are in the range [0, 1] inclusive.

summarization
boolean
Optional
Defaults to false
Enable Summarization, can be true or false

summary_model
enum
Optional
The model to summarize the transcript
Allowed values:
informative
conversational
catchy
summary_type
enum
Optional
The type of summary
Allowed values:
bullets
bullets_verbose
gist
headline
paragraph
topics
list of strings
Optional
The list of custom topics
webhook_auth_header_name
string or null
Optional
The header name to be sent with the transcript completed or failed webhook requests
webhook_auth_header_value
string or null
Optional
The header value to send back with the transcript completed or failed webhook requests for added security
webhook_url
string
Optional
format: "url"
The URL to which we send webhook requests. We sends two different types of webhook requests. One request when a transcript is completed or failed, and one request when the redacted audio is ready if redact_pii_audio is enabled.

custom_topics
boolean
Optional
Defaults to false
Deprecated
Enable custom topics, either true or false
dual_channel
boolean
Optional
Defaults to false
Deprecated
Enable Dual Channel transcription, can be true or false.

prompt
string
Optional
Deprecated
This parameter does not currently have any functionality attached to it.
word_boost
list of strings
Optional
Deprecated
The list of custom vocabulary to boost transcription probability for
Response
Transcript created and queued for processing
id
string
format: "uuid"
The unique identifier of your transcript
audio_url
string
format: "url"
The URL of the media that was transcribed
status
enum
The status of your transcript. Possible values are queued, processing, completed, or error.
Allowed values:
queued
processing
completed
error
language_confidence_threshold
double or null
The confidence threshold for the automatically detected language. An error will be returned if the language confidence is below this threshold.
language_confidence
double or null
>=0
<=1
The confidence score for the detected language, between 0.0 (low confidence) and 1.0 (high confidence)

speech_model
enum or null
The speech model used for the transcription. When null, the universal model is used.

Allowed values:
best
slam-1
universal
webhook_auth
boolean
Whether webhook authentication details were provided
auto_highlights
boolean
Whether Key Phrases is enabled, either true or false
redact_pii
boolean
Whether PII Redaction is enabled, either true or false

summarization
boolean
Whether Summarization is enabled, either true or false

language_model
string
Deprecated
The language model that was used for the transcript
acoustic_model
string
Deprecated
The acoustic model that was used for the transcript
language_code
enum or null
The language of your audio file. Possible values are found in Supported Languages. The default value is ‘en_us’.


Show 102 enum values
language_detection
boolean or null
Whether Automatic language detection is enabled, either true or false

text
string or null
The textual transcript of your media file
words
list of objects or null
An array of temporally-sequential word objects, one for each word in the transcript. See Speech recognition for more information.


Show 6 properties
utterances
list of objects or null
When multichannel or speaker_labels is enabled, a list of turn-by-turn utterance objects. See Speaker diarization and Multichannel transcription for more information.


Show 7 properties
confidence
double or null
>=0
<=1
The confidence score for the transcript, between 0.0 (low confidence) and 1.0 (high confidence)

audio_duration
integer or null
The duration of this transcript object's media file, in seconds
punctuate
boolean or null
Whether Automatic Punctuation is enabled, either true or false
format_text
boolean or null
Whether Text Formatting is enabled, either true or false
disfluencies
boolean or null
Transcribe Filler Words, like “umm”, in your media file; can be true or false

multichannel
boolean or null
Whether Multichannel transcription was enabled in the transcription request, either true or false

audio_channels
integer or null
The number of audio channels in the audio file. This is only present when multichannel is enabled.
webhook_url
string or null
format: "url"
The URL to which we send webhook requests. We sends two different types of webhook requests. One request when a transcript is completed or failed, and one request when the redacted audio is ready if redact_pii_audio is enabled.

webhook_status_code
integer or null
The status code we received from your server when delivering the transcript completed or failed webhook request, if a webhook URL was provided
webhook_auth_header_name
string or null
The header name to be sent with the transcript completed or failed webhook requests
auto_highlights_result
object or null
An array of results for the Key Phrases model, if it is enabled. See Key Phrases for more information.


Show 2 properties
audio_start_from
integer or null
The point in time, in milliseconds, in the file at which the transcription was started
audio_end_at
integer or null
The point in time, in milliseconds, in the file at which the transcription was terminated
boost_param
string or null
The word boost parameter value
filter_profanity
boolean or null
Whether Profanity Filtering is enabled, either true or false

redact_pii_audio
boolean or null
Whether a redacted version of the audio file was generated, either true or false. See PII redaction for more information.

redact_pii_audio_quality
enum or null
The audio quality of the PII-redacted audio file, if redact_pii_audio is enabled. See PII redaction for more information.

Allowed values:
mp3
wav
redact_pii_policies
list of enums or null
The list of PII Redaction policies that were enabled, if PII Redaction is enabled. See PII redaction for more information.


Show 44 enum values
redact_pii_sub
enum or null
The replacement logic for detected PII, can be entity_type or hash. See PII redaction for more details.

Allowed values:
entity_name
hash
speaker_labels
boolean or null
Whether Speaker diarization is enabled, can be true or false

speakers_expected
integer or null
Tell the speaker label model how many speakers it should attempt to identify, up to 10. See Speaker diarization for more details.

content_safety
boolean or null
Whether Content Moderation is enabled, can be true or false

content_safety_labels
object or null
An array of results for the Content Moderation model, if it is enabled. See Content moderation for more information.


Show 4 properties
iab_categories
boolean or null
Whether Topic Detection is enabled, can be true or false

iab_categories_result
object or null
The result of the Topic Detection model, if it is enabled. See Topic Detection for more information.


Show 3 properties
custom_spelling
list of objects or null
Customize how words are spelled and formatted using to and from values

Show 2 properties
keyterms_prompt
list of strings or null
Improve accuracy with up to 1000 domain-specific words or phrases (maximum 6 words per phrase).

auto_chapters
boolean or null
Whether Auto Chapters is enabled, can be true or false

chapters
list of objects or null
An array of temporally sequential chapters for the audio file

Show 5 properties
summary_type
string or null
The type of summary generated, if Summarization is enabled

summary_model
string or null
The Summarization model used to generate the summary, if Summarization is enabled

summary
string or null
The generated summary of the media file, if Summarization is enabled

topics
list of strings or null
The list of custom topics provided if custom topics is enabled
sentiment_analysis
boolean or null
Whether Sentiment Analysis is enabled, can be true or false

sentiment_analysis_results
list of objects or null
An array of results for the Sentiment Analysis model, if it is enabled. See Sentiment Analysis for more information.


Show 7 properties
entity_detection
boolean or null
Whether Entity Detection is enabled, can be true or false

entities
list of objects or null
An array of results for the Entity Detection model, if it is enabled. See Entity detection for more information.


Show 4 properties
speech_threshold
double or null
Defaults to null. Reject audio files that contain less than this fraction of speech. Valid values are in the range [0, 1] inclusive.

throttled
boolean or null
True while a request is throttled and false when a request is no longer throttled
error
string or null
Error message of why the transcript failed
dual_channel
boolean or null
Deprecated
Whether Dual channel transcription was enabled in the transcription request, either true or false

speed_boost
boolean or null
Deprecated
Whether speed boost is enabled
word_boost
list of strings or null
Deprecated
The list of custom vocabulary to boost transcription probability for
prompt
string or null
Deprecated
This parameter does not currently have any functionality attached to it.
custom_topics
boolean or null
Deprecated
Whether custom topics is enabled, either true or false
Errors

400
Bad Request Error

401
Unauthorized Error

404
Not Found Error

429
Too Many Requests Error

500
Internal Server Error

503
Service Unavailable Error

504
Gateway Timeout Error
Was this page helpful?
Yes
No
Previous
Get transcript
Next
Built with
Transcribe audio | AssemblyAI | Documentation


Logo
Search
/
Sign In

API Reference
Overview

Files
POST
Upload a media file

Transcripts
POST
Transcribe audio
GET
Get transcript
GET
Get sentences in transcript
GET
Get paragraphs in transcript
GET
Get subtitles for transcript
GET
Get redacted audio
GET
Search words in transcript
GET
List transcripts
DEL
Delete transcript

LeMUR

Streaming API
API Reference
Transcripts
Get transcript
GET
https://api.assemblyai.com/v2/transcript/:transcript_id
GET
/v2/transcript/:transcript_id

curl https://api.assemblyai.com/v2/transcript/transcript_id \
     -H "Authorization: <apiKey>"
Try it
200
Retrieved

{
  "id": "9ea68fd3-f953-42c1-9742-976c447fb463",
  "audio_url": "https://assembly.ai/wildfires.mp3",
  "status": "completed",
  "language_confidence_threshold": 0.7,
  "language_confidence": 0.9959,
  "speech_model": null,
  "webhook_auth": true,
  "auto_highlights": true,
  "redact_pii": true,
  "summarization": true,
  "language_model": "assemblyai_default",
  "acoustic_model": "assemblyai_default",
  "language_code": "en_us",
  "language_detection": true,
  "text": "Smoke from hundreds of wildfires in Canada is triggering air quality alerts throughout the US. Skylines from Maine to Maryland to Minnesota are gray and smoggy. And in some places, the air quality warnings include the warning to stay inside. We wanted to better understand what's happening here and why, so we called Peter de Carlo, an associate professor in the Department of Environmental Health and Engineering at Johns Hopkins University Varsity. Good morning, professor. Good morning. What is it about the conditions right now that have caused this round of wildfires to affect so many people so far away? Well, there's a couple of things. The season has been pretty dry already. And then the fact that we're getting hit in the US. Is because there's a couple of weather systems that are essentially channeling the smoke from those Canadian wildfires through Pennsylvania into the Mid Atlantic and the Northeast and kind of just dropping the smoke there. So what is it in this haze that makes it harmful? And I'm assuming it is harmful. It is. The levels outside right now in Baltimore are considered unhealthy. And most of that is due to what's called particulate matter, which are tiny particles, microscopic smaller than the width of your hair that can get into your lungs and impact your respiratory system, your cardiovascular system, and even your neurological your brain. What makes this particularly harmful? Is it the volume of particulant? Is it something in particular? What is it exactly? Can you just drill down on that a little bit more? Yeah. So the concentration of particulate matter I was looking at some of the monitors that we have was reaching levels of what are, in science, big 150 micrograms per meter cubed, which is more than ten times what the annual average should be and about four times higher than what you're supposed to have on a 24 hours average. And so the concentrations of these particles in the air are just much, much higher than we typically see. And exposure to those high levels can lead to a host of health problems. And who is most vulnerable? I noticed that in New York City, for example, they're canceling outdoor activities. And so here it is in the early days of summer, and they have to keep all the kids inside. So who tends to be vulnerable in a situation like this? It's the youngest. So children, obviously, whose bodies are still developing. The elderly, who are their bodies are more in decline and they're more susceptible to the health impacts of breathing, the poor air quality. And then people who have preexisting health conditions, people with respiratory conditions or heart conditions can be triggered by high levels of air pollution. Could this get worse? That's a good question. In some areas, it's much worse than others. And it just depends on kind of where the smoke is concentrated. I think New York has some of the higher concentrations right now, but that's going to change as that air moves away from the New York area. But over the course of the next few days, we will see different areas being hit at different times with the highest concentrations. I was going to ask you about more fires start burning. I don't expect the concentrations to go up too much higher. I was going to ask you how and you started to answer this, but how much longer could this last? Or forgive me if I'm asking you to speculate, but what do you think? Well, I think the fires are going to burn for a little bit longer, but the key for us in the US. Is the weather system changing. And so right now, it's kind of the weather systems that are pulling that air into our mid Atlantic and Northeast region. As those weather systems change and shift, we'll see that smoke going elsewhere and not impact us in this region as much. And so I think that's going to be the defining factor. And I think the next couple of days we're going to see a shift in that weather pattern and start to push the smoke away from where we are. And finally, with the impacts of climate change, we are seeing more wildfires. Will we be seeing more of these kinds of wide ranging air quality consequences or circumstances? I mean, that is one of the predictions for climate change. Looking into the future, the fire season is starting earlier and lasting longer, and we're seeing more frequent fires. So, yeah, this is probably something that we'll be seeing more frequently. This tends to be much more of an issue in the Western US. So the eastern US. Getting hit right now is a little bit new. But yeah, I think with climate change moving forward, this is something that is going to happen more frequently. That's Peter De Carlo, associate professor in the Department of Environmental Health and Engineering at Johns Hopkins University. Sergeant Carlo, thanks so much for joining us and sharing this expertise with us. Thank you for having me.",
  "words": [
    {
      "confidence": 0.97465,
      "start": 250,
      "end": 650,
      "text": "Smoke",
      "speaker": null
    },
    {
      "confidence": 0.99999,
      "start": 730,
      "end": 1022,
      "text": "from",
      "speaker": null
    },
    {
      "confidence": 0.99844,
      "start": 1076,
      "end": 1418,
      "text": "hundreds",
      "speaker": null
    },
    {
      "confidence": 0.84,
      "start": 1434,
      "end": 1614,
      "text": "of",
      "speaker": null
    },
    {
      "confidence": 0.89572,
      "start": 1652,
      "end": 2346,
      "text": "wildfires",
      "speaker": null
    },
    {
      "confidence": 0.99994,
      "start": 2378,
      "end": 2526,
      "text": "in",
      "speaker": null
    },
    {
      "confidence": 0.93953,
      "start": 2548,
      "end": 3130,
      "text": "Canada",
      "speaker": null
    },
    {
      "confidence": 0.999,
      "start": 3210,
      "end": 3454,
      "text": "is",
      "speaker": null
    },
    {
      "confidence": 0.74794,
      "start": 3492,
      "end": 3946,
      "text": "triggering",
      "speaker": null
    },
    {
      "confidence": 1,
      "start": 3978,
      "end": 4174,
      "text": "air",
      "speaker": null
    },
    {
      "confidence": 0.88077,
      "start": 4212,
      "end": 4558,
      "text": "quality",
      "speaker": null
    },
    {
      "confidence": 0.94814,
      "start": 4644,
      "end": 5114,
      "text": "alerts",
      "speaker": null
    },
    {
      "confidence": 0.99726,
      "start": 5162,
      "end": 5466,
      "text": "throughout",
      "speaker": null
    },
    {
      "confidence": 0.79,
      "start": 5498,
      "end": 5694,
      "text": "the",
      "speaker": null
    },
    {
      "confidence": 0.89,
      "start": 5732,
      "end": 6382,
      "text": "US.",
      "speaker": null
    }
  ],
  "utterances": [
    {
      "confidence": 0.9359033333333334,
      "start": 250,
      "end": 26950,
      "text": "Smoke from hundreds of wildfires in Canada is triggering air quality alerts throughout the US. Skylines from Maine to Maryland to Minnesota are gray and smoggy. And in some places, the air quality warnings include the warning to stay inside. We wanted to better understand what's happening here and why, so we called Peter de Carlo, an associate professor in the Department of Environmental Health and Engineering at Johns Hopkins University Varsity. Good morning, professor.",
      "words": [
        {
          "confidence": 0.97503,
          "start": 250,
          "end": 650,
          "text": "Smoke",
          "speaker": "A"
        },
        {
          "confidence": 0.99999,
          "start": 730,
          "end": 1022,
          "text": "from",
          "speaker": "A"
        },
        {
          "confidence": 0.99843,
          "start": 1076,
          "end": 1418,
          "text": "hundreds",
          "speaker": "A"
        },
        {
          "confidence": 0.85,
          "start": 1434,
          "end": 1614,
          "text": "of",
          "speaker": "A"
        },
        {
          "confidence": 0.89657,
          "start": 1652,
          "end": 2346,
          "text": "wildfires",
          "speaker": "A"
        },
        {
          "confidence": 0.99994,
          "start": 2378,
          "end": 2526,
          "text": "in",
          "speaker": "A"
        },
        {
          "confidence": 0.93864,
          "start": 2548,
          "end": 3130,
          "text": "Canada",
          "speaker": "A"
        },
        {
          "confidence": 0.999,
          "start": 3210,
          "end": 3454,
          "text": "is",
          "speaker": "A"
        },
        {
          "confidence": 0.75366,
          "start": 3492,
          "end": 3946,
          "text": "triggering",
          "speaker": "A"
        },
        {
          "confidence": 1,
          "start": 3978,
          "end": 4174,
          "text": "air",
          "speaker": "A"
        },
        {
          "confidence": 0.87745,
          "start": 4212,
          "end": 4558,
          "text": "quality",
          "speaker": "A"
        },
        {
          "confidence": 0.94739,
          "start": 4644,
          "end": 5114,
          "text": "alerts",
          "speaker": "A"
        },
        {
          "confidence": 0.99726,
          "start": 5162,
          "end": 5466,
          "text": "throughout",
          "speaker": "A"
        },
        {
          "confidence": 0.79,
          "start": 5498,
          "end": 5694,
          "text": "the",
          "speaker": "A"
        },
        {
          "confidence": 0.88,
          "start": 5732,
          "end": 6382,
          "text": "US.",
          "speaker": "A"
        }
      ],
      "speaker": "A"
    }
  ],
  "confidence": 0.9404651451800253,
  "audio_duration": 281,
  "punctuate": true,
  "format_text": true,
  "disfluencies": false,
  "multichannel": false,
  "webhook_url": "https://your-webhook-url.tld/path",
  "webhook_status_code": 200,
  "webhook_auth_header_name": "webhook-secret",
  "auto_highlights_result": {
    "status": "success",
    "results": [
      {
        "count": 1,
        "rank": 0.08,
        "text": "air quality alerts",
        "timestamps": [
          {
            "start": 3978,
            "end": 5114
          }
        ]
      },
      {
        "count": 1,
        "rank": 0.08,
        "text": "wide ranging air quality consequences",
        "timestamps": [
          {
            "start": 235388,
            "end": 238694
          }
        ]
      },
      {
        "count": 1,
        "rank": 0.07,
        "text": "more wildfires",
        "timestamps": [
          {
            "start": 230972,
            "end": 232354
          }
        ]
      },
      {
        "count": 1,
        "rank": 0.07,
        "text": "air pollution",
        "timestamps": [
          {
            "start": 156004,
            "end": 156910
          }
        ]
      },
      {
        "count": 3,
        "rank": 0.07,
        "text": "weather systems",
        "timestamps": [
          {
            "start": 47344,
            "end": 47958
          },
          {
            "start": 205268,
            "end": 205818
          },
          {
            "start": 211588,
            "end": 213434
          }
        ]
      },
      {
        "count": 2,
        "rank": 0.06,
        "text": "high levels",
        "timestamps": [
          {
            "start": 121128,
            "end": 121646
          },
          {
            "start": 155412,
            "end": 155866
          }
        ]
      },
      {
        "count": 1,
        "rank": 0.06,
        "text": "health conditions",
        "timestamps": [
          {
            "start": 152138,
            "end": 152666
          }
        ]
      },
      {
        "count": 2,
        "rank": 0.06,
        "text": "Peter de Carlo",
        "timestamps": [
          {
            "start": 18948,
            "end": 19930
          },
          {
            "start": 268298,
            "end": 269194
          }
        ]
      },
      {
        "count": 1,
        "rank": 0.06,
        "text": "New York City",
        "timestamps": [
          {
            "start": 125768,
            "end": 126274
          }
        ]
      },
      {
        "count": 1,
        "rank": 0.05,
        "text": "respiratory conditions",
        "timestamps": [
          {
            "start": 152964,
            "end": 153786
          }
        ]
      },
      {
        "count": 3,
        "rank": 0.05,
        "text": "New York",
        "timestamps": [
          {
            "start": 125768,
            "end": 126034
          },
          {
            "start": 171448,
            "end": 171938
          },
          {
            "start": 176008,
            "end": 176322
          }
        ]
      },
      {
        "count": 3,
        "rank": 0.05,
        "text": "climate change",
        "timestamps": [
          {
            "start": 229548,
            "end": 230230
          },
          {
            "start": 244576,
            "end": 245162
          },
          {
            "start": 263348,
            "end": 263950
          }
        ]
      },
      {
        "count": 1,
        "rank": 0.05,
        "text": "Johns Hopkins University Varsity",
        "timestamps": [
          {
            "start": 23972,
            "end": 25490
          }
        ]
      },
      {
        "count": 1,
        "rank": 0.05,
        "text": "heart conditions",
        "timestamps": [
          {
            "start": 153988,
            "end": 154506
          }
        ]
      },
      {
        "count": 1,
        "rank": 0.05,
        "text": "air quality warnings",
        "timestamps": [
          {
            "start": 12308,
            "end": 13434
          }
        ]
      }
    ]
  },
  "audio_start_from": 10,
  "audio_end_at": 280,
  "boost_param": "high",
  "filter_profanity": true,
  "redact_pii_audio": true,
  "redact_pii_audio_quality": "mp3",
  "redact_pii_policies": [
    "us_social_security_number",
    "credit_card_number"
  ],
  "redact_pii_sub": "hash",
  "speaker_labels": true,
  "speakers_expected": 2,
  "content_safety": true,
  "content_safety_labels": {
    "status": "success",
    "results": [
      {
        "text": "Smoke from hundreds of wildfires in Canada is triggering air quality alerts throughout the US. Skylines from Maine to Maryland to Minnesota are gray and smoggy. And in some places, the air quality warnings include the warning to stay inside. We wanted to better understand what's happening here and why, so we called Peter de Carlo, an associate professor in the Department of Environmental Health and Engineering at Johns Hopkins University Varsity. Good morning, professor. Good morning.",
        "labels": [
          {
            "label": "disasters",
            "confidence": 0.8142836093902588,
            "severity": 0.4093044400215149
          }
        ],
        "sentences_idx_start": 0,
        "sentences_idx_end": 5,
        "timestamp": {
          "start": 250,
          "end": 28840
        }
      }
    ],
    "summary": {
      "disasters": 0.9940800441842205,
      "health_issues": 0.9216489289040967
    },
    "severity_score_summary": {
      "disasters": {
        "low": 0.5733263024656846,
        "medium": 0.42667369753431533,
        "high": 0
      },
      "health_issues": {
        "low": 0.22863814977924785,
        "medium": 0.45014154926938227,
        "high": 0.32122030095136983
      }
    }
  },
  "iab_categories": true,
  "iab_categories_result": {
    "status": "success",
    "results": [
      {
        "text": "Smoke from hundreds of wildfires in Canada is triggering air quality alerts throughout the US. Skylines from Maine to Maryland to Minnesota are gray and smoggy. And in some places, the air quality warnings include the warning to stay inside. We wanted to better understand what's happening here and why, so we called Peter de Carlo, an associate professor in the Department of Environmental Health and Engineering at Johns Hopkins University Varsity. Good morning, professor. Good morning.",
        "labels": [
          {
            "relevance": 0.988274097442627,
            "label": "Home&Garden>IndoorEnvironmentalQuality"
          },
          {
            "relevance": 0.5821335911750793,
            "label": "NewsAndPolitics>Weather"
          },
          {
            "relevance": 0.0042327106930315495,
            "label": "MedicalHealth>DiseasesAndConditions>LungAndRespiratoryHealth"
          },
          {
            "relevance": 0.0033971222583204508,
            "label": "NewsAndPolitics>Disasters"
          },
          {
            "relevance": 0.002469958271831274,
            "label": "BusinessAndFinance>Business>GreenSolutions"
          },
          {
            "relevance": 0.0014376690378412604,
            "label": "MedicalHealth>DiseasesAndConditions>Cancer"
          },
          {
            "relevance": 0.0014294233405962586,
            "label": "Science>Environment"
          },
          {
            "relevance": 0.001234519761055708,
            "label": "Travel>TravelLocations>PolarTravel"
          },
          {
            "relevance": 0.0010231725173071027,
            "label": "MedicalHealth>DiseasesAndConditions>ColdAndFlu"
          },
          {
            "relevance": 0.0007445293595083058,
            "label": "BusinessAndFinance>Industries>PowerAndEnergyIndustry"
          }
        ],
        "timestamp": {
          "start": 250,
          "end": 28840
        }
      }
    ],
    "summary": {
      "NewsAndPolitics>Weather": 1,
      "Home&Garden>IndoorEnvironmentalQuality": 0.9043831825256348,
      "Science>Environment": 0.16117265820503235,
      "BusinessAndFinance>Industries>EnvironmentalServicesIndustry": 0.14393523335456848,
      "MedicalHealth>DiseasesAndConditions>LungAndRespiratoryHealth": 0.11401086300611496,
      "BusinessAndFinance>Business>GreenSolutions": 0.06348437070846558,
      "NewsAndPolitics>Disasters": 0.05041387677192688,
      "Travel>TravelLocations>PolarTravel": 0.01308488193899393,
      "HealthyLiving": 0.008222488686442375,
      "MedicalHealth>DiseasesAndConditions>ColdAndFlu": 0.0022315620444715023,
      "MedicalHealth>DiseasesAndConditions>HeartAndCardiovascularDiseases": 0.00213034451007843,
      "HealthyLiving>Wellness>SmokingCessation": 0.001540527562610805,
      "MedicalHealth>DiseasesAndConditions>Injuries": 0.0013950627762824297,
      "BusinessAndFinance>Industries>PowerAndEnergyIndustry": 0.0012570273829624057,
      "MedicalHealth>DiseasesAndConditions>Cancer": 0.001097781932912767,
      "MedicalHealth>DiseasesAndConditions>Allergies": 0.0010148967849090695,
      "MedicalHealth>DiseasesAndConditions>MentalHealth": 0.000717321818228811,
      "Style&Fashion>PersonalCare>DeodorantAndAntiperspirant": 0.0006022014422342181,
      "Technology&Computing>Computing>ComputerNetworking": 0.0005461975233629346,
      "MedicalHealth>DiseasesAndConditions>Injuries>FirstAid": 0.0004885646631009877
    }
  },
  "auto_chapters": true,
  "chapters": [
    {
      "gist": "Smoggy air quality alerts across US",
      "headline": "Smoke from hundreds of wildfires in Canada is triggering air quality alerts across US",
      "summary": "Smoke from hundreds of wildfires in Canada is triggering air quality alerts throughout the US. Skylines from Maine to Maryland to Minnesota are gray and smoggy. In some places, the air quality warnings include the warning to stay inside.",
      "start": 250,
      "end": 28840
    },
    {
      "gist": "What is it about the conditions right now that have caused this round",
      "headline": "High particulate matter in wildfire smoke can lead to serious health problems",
      "summary": "Air pollution levels in Baltimore are considered unhealthy. Exposure to high levels can lead to a host of health problems. With climate change, we are seeing more wildfires. Will we be seeing more of these kinds of wide ranging air quality consequences?",
      "start": 29610,
      "end": 280340
    }
  ],
  "summary_type": "bullets",
  "summary_model": "informative",
  "summary": "- Smoke from hundreds of wildfires in Canada is triggering air quality alerts throughout the US. Skylines from Maine to Maryland to Minnesota are gray and smoggy. In some places, the air quality warnings include the warning to stay inside.\\n- Air pollution levels in Baltimore are considered unhealthy. Exposure to high levels can lead to a host of health problems. With climate change, we are seeing more wildfires. Will we be seeing more of these kinds of wide ranging air quality consequences?",
  "topics": [],
  "sentiment_analysis": true,
  "entity_detection": true,
  "entities": [
    {
      "entity_type": "location",
      "text": "Canada",
      "start": 2548,
      "end": 3130
    },
    {
      "entity_type": "location",
      "text": "the US",
      "start": 5498,
      "end": 6382
    },
    {
      "entity_type": "location",
      "text": "Maine",
      "start": 7492,
      "end": 7914
    },
    {
      "entity_type": "location",
      "text": "Maryland",
      "start": 8212,
      "end": 8634
    },
    {
      "entity_type": "location",
      "text": "Minnesota",
      "start": 8932,
      "end": 9578
    },
    {
      "entity_type": "person_name",
      "text": "Peter de Carlo",
      "start": 18948,
      "end": 19930
    },
    {
      "entity_type": "occupation",
      "text": "associate professor",
      "start": 20292,
      "end": 21194
    },
    {
      "entity_type": "organization",
      "text": "Department of Environmental Health and Engineering",
      "start": 21508,
      "end": 23706
    },
    {
      "entity_type": "organization",
      "text": "Johns Hopkins University Varsity",
      "start": 23972,
      "end": 25490
    },
    {
      "entity_type": "occupation",
      "text": "professor",
      "start": 26076,
      "end": 26950
    },
    {
      "entity_type": "location",
      "text": "the US",
      "start": 45184,
      "end": 45898
    },
    {
      "entity_type": "nationality",
      "text": "Canadian",
      "start": 49728,
      "end": 50086
    }
  ],
  "speech_threshold": 0.5,
  "dual_channel": false,
  "word_boost": [
    "aws",
    "azure",
    "google cloud"
  ],
  "custom_topics": true
}
To retrieve your transcriptions on our EU server, replace api.assemblyai.com with api.eu.assemblyai.com.
Get the transcript resource. The transcript is ready when the “status” is “completed”.

Path parameters
transcript_id
string
Required
ID of the transcript
Headers
Authorization
string
Required
Response
The transcript resource
id
string
format: "uuid"
The unique identifier of your transcript
audio_url
string
format: "url"
The URL of the media that was transcribed
status
enum
The status of your transcript. Possible values are queued, processing, completed, or error.
Allowed values:
queued
processing
completed
error
language_confidence_threshold
double or null
The confidence threshold for the automatically detected language. An error will be returned if the language confidence is below this threshold.
language_confidence
double or null
>=0
<=1
The confidence score for the detected language, between 0.0 (low confidence) and 1.0 (high confidence)

speech_model
enum or null
The speech model used for the transcription. When null, the universal model is used.

Allowed values:
best
slam-1
universal
webhook_auth
boolean
Whether webhook authentication details were provided
auto_highlights
boolean
Whether Key Phrases is enabled, either true or false
redact_pii
boolean
Whether PII Redaction is enabled, either true or false

summarization
boolean
Whether Summarization is enabled, either true or false

language_model
string
Deprecated
The language model that was used for the transcript
acoustic_model
string
Deprecated
The acoustic model that was used for the transcript
language_code
enum or null
The language of your audio file. Possible values are found in Supported Languages. The default value is ‘en_us’.


Show 102 enum values
language_detection
boolean or null
Whether Automatic language detection is enabled, either true or false

text
string or null
The textual transcript of your media file
words
list of objects or null
An array of temporally-sequential word objects, one for each word in the transcript. See Speech recognition for more information.


Show 6 properties
utterances
list of objects or null
When multichannel or speaker_labels is enabled, a list of turn-by-turn utterance objects. See Speaker diarization and Multichannel transcription for more information.


Show 7 properties
confidence
double or null
>=0
<=1
The confidence score for the transcript, between 0.0 (low confidence) and 1.0 (high confidence)

audio_duration
integer or null
The duration of this transcript object's media file, in seconds
punctuate
boolean or null
Whether Automatic Punctuation is enabled, either true or false
format_text
boolean or null
Whether Text Formatting is enabled, either true or false
disfluencies
boolean or null
Transcribe Filler Words, like “umm”, in your media file; can be true or false

multichannel
boolean or null
Whether Multichannel transcription was enabled in the transcription request, either true or false

audio_channels
integer or null
The number of audio channels in the audio file. This is only present when multichannel is enabled.
webhook_url
string or null
format: "url"
The URL to which we send webhook requests. We sends two different types of webhook requests. One request when a transcript is completed or failed, and one request when the redacted audio is ready if redact_pii_audio is enabled.

webhook_status_code
integer or null
The status code we received from your server when delivering the transcript completed or failed webhook request, if a webhook URL was provided
webhook_auth_header_name
string or null
The header name to be sent with the transcript completed or failed webhook requests
auto_highlights_result
object or null
An array of results for the Key Phrases model, if it is enabled. See Key Phrases for more information.


Show 2 properties
audio_start_from
integer or null
The point in time, in milliseconds, in the file at which the transcription was started
audio_end_at
integer or null
The point in time, in milliseconds, in the file at which the transcription was terminated
boost_param
string or null
The word boost parameter value
filter_profanity
boolean or null
Whether Profanity Filtering is enabled, either true or false

redact_pii_audio
boolean or null
Whether a redacted version of the audio file was generated, either true or false. See PII redaction for more information.

redact_pii_audio_quality
enum or null
The audio quality of the PII-redacted audio file, if redact_pii_audio is enabled. See PII redaction for more information.

Allowed values:
mp3
wav
redact_pii_policies
list of enums or null
The list of PII Redaction policies that were enabled, if PII Redaction is enabled. See PII redaction for more information.


Show 44 enum values
redact_pii_sub
enum or null
The replacement logic for detected PII, can be entity_type or hash. See PII redaction for more details.

Allowed values:
entity_name
hash
speaker_labels
boolean or null
Whether Speaker diarization is enabled, can be true or false

speakers_expected
integer or null
Tell the speaker label model how many speakers it should attempt to identify, up to 10. See Speaker diarization for more details.

content_safety
boolean or null
Whether Content Moderation is enabled, can be true or false

content_safety_labels
object or null
An array of results for the Content Moderation model, if it is enabled. See Content moderation for more information.


Show 4 properties
iab_categories
boolean or null
Whether Topic Detection is enabled, can be true or false

iab_categories_result
object or null
The result of the Topic Detection model, if it is enabled. See Topic Detection for more information.


Show 3 properties
custom_spelling
list of objects or null
Customize how words are spelled and formatted using to and from values

Show 2 properties
keyterms_prompt
list of strings or null
Improve accuracy with up to 1000 domain-specific words or phrases (maximum 6 words per phrase).

auto_chapters
boolean or null
Whether Auto Chapters is enabled, can be true or false

chapters
list of objects or null
An array of temporally sequential chapters for the audio file

Show 5 properties
summary_type
string or null
The type of summary generated, if Summarization is enabled

summary_model
string or null
The Summarization model used to generate the summary, if Summarization is enabled

summary
string or null
The generated summary of the media file, if Summarization is enabled

topics
list of strings or null
The list of custom topics provided if custom topics is enabled
sentiment_analysis
boolean or null
Whether Sentiment Analysis is enabled, can be true or false

sentiment_analysis_results
list of objects or null
An array of results for the Sentiment Analysis model, if it is enabled. See Sentiment Analysis for more information.


Show 7 properties
entity_detection
boolean or null
Whether Entity Detection is enabled, can be true or false

entities
list of objects or null
An array of results for the Entity Detection model, if it is enabled. See Entity detection for more information.


Show 4 properties
speech_threshold
double or null
Defaults to null. Reject audio files that contain less than this fraction of speech. Valid values are in the range [0, 1] inclusive.

throttled
boolean or null
True while a request is throttled and false when a request is no longer throttled
error
string or null
Error message of why the transcript failed
dual_channel
boolean or null
Deprecated
Whether Dual channel transcription was enabled in the transcription request, either true or false

speed_boost
boolean or null
Deprecated
Whether speed boost is enabled
word_boost
list of strings or null
Deprecated
The list of custom vocabulary to boost transcription probability for
prompt
string or null
Deprecated
This parameter does not currently have any functionality attached to it.
custom_topics
boolean or null
Deprecated
Whether custom topics is enabled, either true or false
Errors

400
Bad Request Error

401
Unauthorized Error

404
Not Found Error

429
Too Many Requests Error

500
Internal Server Error

503
Service Unavailable Error

504
Gateway Timeout Error
Was this page helpful?
Yes
No
Previous
Get sentences in transcript
Next
Built with
Get transcript | AssemblyAI | Documentation


Logo
Search
/
Sign In

API Reference
Overview

Files
POST
Upload a media file

Transcripts
POST
Transcribe audio
GET
Get transcript
GET
Get sentences in transcript
GET
Get paragraphs in transcript
GET
Get subtitles for transcript
GET
Get redacted audio
GET
Search words in transcript
GET
List transcripts
DEL
Delete transcript

LeMUR

Streaming API
API Reference
Transcripts
Get sentences in transcript
GET
https://api.assemblyai.com/v2/transcript/:transcript_id/sentences
GET
/v2/transcript/:transcript_id/sentences

curl https://api.assemblyai.com/v2/transcript/transcript_id/sentences \
     -H "Authorization: <apiKey>"
Try it
200
Retrieved

{
  "id": "d5a3d302-066e-43fb-b63b-8f57baf185db",
  "confidence": 0.9579390654205628,
  "audio_duration": 281,
  "sentences": [
    {
      "text": "Smoke from hundreds of wildfires in Canada is triggering air quality alerts throughout the US.",
      "start": 250,
      "end": 6350,
      "confidence": 0.72412,
      "words": [
        {
          "confidence": 0.72412,
          "start": 250,
          "end": 650,
          "text": "Smoke",
          "speaker": null
        },
        {
          "confidence": 0.99996,
          "start": 730,
          "end": 1022,
          "text": "from",
          "speaker": null
        },
        {
          "confidence": 0.99992,
          "start": 1076,
          "end": 1466,
          "text": "hundreds",
          "speaker": null
        },
        {
          "confidence": 1,
          "start": 1498,
          "end": 1646,
          "text": "of",
          "speaker": null
        }
      ],
      "speaker": null
    },
    {
      "text": "Skylines from Maine to Maryland to Minnesota are gray and smoggy.",
      "start": 6500,
      "end": 11050,
      "confidence": 0.99819,
      "words": [
        {
          "confidence": 0.99819,
          "start": 6500,
          "end": 7306,
          "text": "Skylines",
          "speaker": null
        },
        {
          "confidence": 0.99987,
          "start": 7338,
          "end": 7534,
          "text": "from",
          "speaker": null
        },
        {
          "confidence": 0.9972,
          "start": 7572,
          "end": 7962,
          "text": "Maine",
          "speaker": null
        },
        {
          "confidence": 1,
          "start": 8026,
          "end": 8206,
          "text": "to",
          "speaker": null
        },
        {
          "confidence": 0.5192,
          "start": 8228,
          "end": 8650,
          "text": "Maryland",
          "speaker": null
        },
        {
          "confidence": 1,
          "start": 8730,
          "end": 8926,
          "text": "to",
          "speaker": null
        }
      ],
      "speaker": null
    }
  ]
}
To retrieve your transcriptions on our EU server, replace api.assemblyai.com with api.eu.assemblyai.com.
Get the transcript split by sentences. The API will attempt to semantically segment the transcript into sentences to create more reader-friendly transcripts.

Path parameters
transcript_id
string
Required
ID of the transcript
Headers
Authorization
string
Required
Response
Exported sentences
id
string
format: "uuid"
The unique identifier for the transcript
confidence
double
>=0
<=1
The confidence score for the transcript
audio_duration
double
The duration of the audio file in seconds
sentences
list of objects
An array of sentences in the transcript

Show 7 properties
Errors

400
Bad Request Error

401
Unauthorized Error

404
Not Found Error

429
Too Many Requests Error

500
Internal Server Error

503
Service Unavailable Error

504
Gateway Timeout Error
Was this page helpful?
Yes
No
Previous
Get paragraphs in transcript
Next
Built with
Get sentences in transcript | AssemblyAI | Documentation


Logo
Search
/
Sign In

API Reference
Overview

Files
POST
Upload a media file

Transcripts
POST
Transcribe audio
GET
Get transcript
GET
Get sentences in transcript
GET
Get paragraphs in transcript
GET
Get subtitles for transcript
GET
Get redacted audio
GET
Search words in transcript
GET
List transcripts
DEL
Delete transcript

LeMUR

Streaming API
API Reference
Transcripts
Get paragraphs in transcript
GET
https://api.assemblyai.com/v2/transcript/:transcript_id/paragraphs
GET
/v2/transcript/:transcript_id/paragraphs

curl https://api.assemblyai.com/v2/transcript/transcript_id/paragraphs \
     -H "Authorization: <apiKey>"
Try it
200
Retrieved

{
  "id": "d5a3d302-066e-43fb-b63b-8f57baf185db",
  "confidence": 0.9578730257009361,
  "audio_duration": 281,
  "paragraphs": [
    {
      "text": "Smoke from hundreds of wildfires in Canada is triggering air quality alerts throughout the US. Skylines from Maine to Maryland to Minnesota are gray and smoggy. And in some places, the air quality warnings include the warning to stay inside. We wanted to better understand what's happening here and why, so we called Peter Decarlo, an associate professor in the Department of Environmental Health and Engineering at Johns Hopkins University. Good morning, professor.",
      "start": 250,
      "end": 26950,
      "confidence": 0.73033,
      "words": [
        {
          "confidence": 0.73033,
          "start": 250,
          "end": 650,
          "text": "Smoke",
          "speaker": null
        },
        {
          "confidence": 1,
          "start": 730,
          "end": 1022,
          "text": "from",
          "speaker": null
        },
        {
          "confidence": 0.99992,
          "start": 1076,
          "end": 1466,
          "text": "hundreds",
          "speaker": null
        },
        {
          "confidence": 1,
          "start": 1498,
          "end": 1646,
          "text": "of",
          "speaker": null
        }
      ]
    },
    {
      "text": "Good morning. So what is it about the conditions right now that have caused this round of wildfires to affect so many people so far away? Well, there's a couple of things. The season has been pretty dry already, and then the fact that we're getting hit in the US. Is because there's a couple of weather systems that are essentially channeling the smoke from those Canadian wildfires through Pennsylvania into the Mid Atlantic and the Northeast and kind of just dropping the smoke there.",
      "start": 27850,
      "end": 56190,
      "confidence": 0.99667,
      "words": [
        {
          "confidence": 0.99667,
          "start": 27850,
          "end": 28262,
          "text": "Good",
          "speaker": null
        },
        {
          "confidence": 0.99742,
          "start": 28316,
          "end": 28920,
          "text": "morning.",
          "speaker": null
        },
        {
          "confidence": 0.94736,
          "start": 29290,
          "end": 29702,
          "text": "So",
          "speaker": null
        }
      ]
    }
  ]
}
To retrieve your transcriptions on our EU server, replace api.assemblyai.com with api.eu.assemblyai.com.
Get the transcript split by paragraphs. The API will attempt to semantically segment your transcript into paragraphs to create more reader-friendly transcripts.

Path parameters
transcript_id
string
Required
ID of the transcript
Headers
Authorization
string
Required
Response
Exported paragraphs
id
string
format: "uuid"
The unique identifier of your transcript
confidence
double
>=0
<=1
The confidence score for the transcript
audio_duration
double
The duration of the audio file in seconds
paragraphs
list of objects
An array of paragraphs in the transcript

Show 5 properties
Errors

400
Bad Request Error

401
Unauthorized Error

404
Not Found Error

429
Too Many Requests Error

500
Internal Server Error

503
Service Unavailable Error

504
Gateway Timeout Error
Was this page helpful?
Yes
No
Previous
Get subtitles for transcript
Next
Built with
Get paragraphs in transcript | AssemblyAI | Documentation


Logo
Search
/
Sign In

API Reference
Overview

Files
POST
Upload a media file

Transcripts
POST
Transcribe audio
GET
Get transcript
GET
Get sentences in transcript
GET
Get paragraphs in transcript
GET
Get subtitles for transcript
GET
Get redacted audio
GET
Search words in transcript
GET
List transcripts
DEL
Delete transcript

LeMUR

Streaming API
API Reference
Transcripts
Get subtitles for transcript
GET
https://api.assemblyai.com/v2/transcript/:transcript_id/:subtitle_format
GET
/v2/transcript/:transcript_id/:subtitle_format

curl https://api.assemblyai.com/v2/transcript/transcript_id/srt \
     -H "Authorization: <apiKey>"
Try it

200
srt

"1\n00:00:13,160 --> 00:00:16,694\nLast year I showed these two slides that demonstrate that the Arctic\n\n2\n00:00:16,734 --> 00:00:20,214\nice cap, which for most of the last 3 million years has been the size\n\n3\n00:00:20,254 --> 00:00:23,274\nof the lower 48 states, has shrunk by 40%.\n"
To retrieve your transcriptions on our EU server, replace api.assemblyai.com with api.eu.assemblyai.com.
Export your transcript in SRT or VTT format to use with a video player for subtitles and closed captions.

Path parameters
transcript_id
string
Required
ID of the transcript
subtitle_format
enum
Required
The format of the captions
Allowed values:
srt
vtt
Headers
Authorization
string
Required
Query parameters
chars_per_caption
integer
Optional
The maximum number of characters per caption
Response
This endpoint returns an object.
Errors

400
Bad Request Error

401
Unauthorized Error

404
Not Found Error

429
Too Many Requests Error

500
Internal Server Error

503
Service Unavailable Error

504
Gateway Timeout Error
Was this page helpful?
Yes
No
Previous
Get redacted audio
Next
Built with
Get subtitles for transcript | AssemblyAI | Documentation



Logo
Search
/
Sign In

API Reference
Overview

Files
POST
Upload a media file

Transcripts
POST
Transcribe audio
GET
Get transcript
GET
Get sentences in transcript
GET
Get paragraphs in transcript
GET
Get subtitles for transcript
GET
Get redacted audio
GET
Search words in transcript
GET
List transcripts
DEL
Delete transcript

LeMUR

Streaming API
API Reference
Transcripts
Get redacted audio
GET
https://api.assemblyai.com/v2/transcript/:transcript_id/redacted-audio
GET
/v2/transcript/:transcript_id/redacted-audio

curl https://api.assemblyai.com/v2/transcript/transcript_id/redacted-audio \
     -H "Authorization: <apiKey>"
Try it
200
Retrieved

{
  "status": "redacted_audio_ready",
  "redacted_audio_url": "https://s3.us-west-2.amazonaws.com/api.assembly.ai.usw2/redacted-audio/785efd9e-0e20-45e1-967b-3db17770ed9f.wav?AWSAccessKeyId=aws-access-key0id&Signature=signature&x-amz-security-token=security-token&Expires=1698966551"
}
Redacted audio creation is not supported on the EU endpoint.
Retrieve the redacted audio object containing the status and URL to the redacted audio.

Path parameters
transcript_id
string
Required
ID of the transcript
Headers
Authorization
string
Required
Response
The redacted audio object containing the status and URL to the redacted audio
status
enum
The status of the redacted audio
Allowed values:
redacted_audio_ready
redacted_audio_url
string
format: "url"
The URL of the redacted audio file
Errors

400
Bad Request Error

401
Unauthorized Error

404
Not Found Error

429
Too Many Requests Error

500
Internal Server Error

503
Service Unavailable Error

504
Gateway Timeout Error
Was this page helpful?
Yes
No
Previous
Search words in transcript
Next
Built with
Get redacted audio | AssemblyAI | Documentation



Logo
Search
/
Sign In

API Reference
Overview

Files
POST
Upload a media file

Transcripts
POST
Transcribe audio
GET
Get transcript
GET
Get sentences in transcript
GET
Get paragraphs in transcript
GET
Get subtitles for transcript
GET
Get redacted audio
GET
Search words in transcript
GET
List transcripts
DEL
Delete transcript

LeMUR

Streaming API
API Reference
Transcripts
Search words in transcript
GET
https://api.assemblyai.com/v2/transcript/:transcript_id/word-search
GET
/v2/transcript/:transcript_id/word-search

curl -G https://api.assemblyai.com/v2/transcript/transcript_id/word-search \
     -H "Authorization: <apiKey>" \
     -d words=foo
Try it
200
Retrieved

{
  "id": "d5a3d302-066e-43fb-b63b-8f57baf185db",
  "total_count": 10,
  "matches": [
    {
      "text": "smoke",
      "count": 6,
      "timestamps": [
        [
          250,
          650
        ],
        [
          49168,
          49398
        ],
        [
          55284,
          55594
        ],
        [
          168888,
          169118
        ],
        [
          215108,
          215386
        ],
        [
          225944,
          226170
        ]
      ],
      "indexes": [
        0,
        136,
        156,
        486,
        652,
        698
      ]
    },
    {
      "text": "wildfires",
      "count": 4,
      "timestamps": [
        [
          1668,
          2346
        ],
        [
          33852,
          34546
        ],
        [
          50118,
          51110
        ],
        [
          231356,
          232354
        ]
      ],
      "indexes": [
        4,
        90,
        140,
        716
      ]
    }
  ]
}
To search through a transcription created on our EU server, replace api.assemblyai.com with api.eu.assemblyai.com.
Search through the transcript for keywords. You can search for individual words, numbers, or phrases containing up to five words or numbers.

Path parameters
transcript_id
string
Required
ID of the transcript
Headers
Authorization
string
Required
Query parameters
words
list of strings
Required
Keywords to search for
Response
Word search response
id
string
format: "uuid"
The ID of the transcript
total_count
integer
The total count of all matched instances. For e.g., word 1 matched 2 times, and word 2 matched 3 times, total_count will equal 5.

matches
list of objects
The matches of the search

Show 4 properties
Errors

400
Bad Request Error

401
Unauthorized Error

404
Not Found Error

429
Too Many Requests Error

500
Internal Server Error

503
Service Unavailable Error

504
Gateway Timeout Error
Was this page helpful?
Yes
No
Previous
List transcripts
Next
Built with
Search words in transcript | AssemblyAI | Documentation



Logo
Search
/
Sign In

API Reference
Overview

Files
POST
Upload a media file

Transcripts
POST
Transcribe audio
GET
Get transcript
GET
Get sentences in transcript
GET
Get paragraphs in transcript
GET
Get subtitles for transcript
GET
Get redacted audio
GET
Search words in transcript
GET
List transcripts
DEL
Delete transcript

LeMUR

Streaming API
API Reference
Transcripts
List transcripts
GET
https://api.assemblyai.com/v2/transcript
GET
/v2/transcript

curl https://api.assemblyai.com/v2/transcript \
     -H "Authorization: <apiKey>"
Try it
200
Retrieved

{
  "page_details": {
    "limit": 3,
    "result_count": 3,
    "current_url": "https://api.assemblyai.com/v2/transcript?limit=3",
    "prev_url": "https://api.assemblyai.com/v2/transcript?limit=3&before_id=28a73d01-98db-41dd-9e98-2533ba0af117",
    "next_url": "https://api.assemblyai.com/v2/transcript?limit=3&after_id=b33f4691-85b7-4f31-be12-a87cef1c1229"
  },
  "transcripts": [
    {
      "id": "b33f4691-85b7-4f31-be12-a87cef1c1229",
      "resource_url": "https://api.assemblyai.com/v2/transcript/b33f4691-85b7-4f31-be12-a87cef1c1229",
      "status": "completed",
      "created": "2024-03-11T21:29:59.936851",
      "audio_url": "http://deleted_by_user",
      "error": null,
      "completed": "2024-03-11T21:30:07.314223"
    },
    {
      "id": "ce522f10-d204-42e8-a838-6b95098145cc",
      "resource_url": "https://api.assemblyai.com/v2/transcript/ce522f10-d204-42e8-a838-6b95098145cc",
      "status": "error",
      "created": "2024-03-11T21:23:59.979420",
      "audio_url": "https://storage.googleapis.com/client-docs-samples/nbc.oopsie",
      "error": "Download error, unable to download https://storage.googleapis.com/client-docs-samples/nbc.oopsie. Please make sure the file exists and is accessible from the internet.",
      "completed": "foo"
    },
    {
      "id": "28a73d01-98db-41dd-9e98-2533ba0af117",
      "resource_url": "https://api.assemblyai.com/v2/transcript/28a73d01-98db-41dd-9e98-2533ba0af117",
      "status": "completed",
      "created": "2024-03-11T21:12:57.372215",
      "audio_url": "https://assembly.ai/nbc.mp3",
      "error": null,
      "completed": "2024-03-11T21:13:03.267020"
    }
  ]
}
To retrieve your transcriptions on our EU server, replace api.assemblyai.com with api.eu.assemblyai.com.
Retrieve a list of transcripts you created. Transcripts are sorted from newest to oldest and can be retrieved for the last 90 days of usage. The previous URL always points to a page with older transcripts.

If you need to retrieve transcripts from more than 90 days ago please reach out to our Support team at support@assemblyai.com.

Headers
Authorization
string
Required
Query parameters
limit
any
Optional
Maximum amount of transcripts to retrieve
status
enum
Optional
Filter by transcript status
Allowed values:
queued
processing
completed
error
created_on
any
Optional
Only get transcripts created on this date
before_id
any
Optional
Get transcripts that were created before this transcript ID
after_id
any
Optional
Get transcripts that were created after this transcript ID
throttled_only
any
Optional
Deprecated
Only get throttled transcripts, overrides the status filter
Response
A list of transcripts. Transcripts are sorted from newest to oldest. The previous URL always points to a page with older transcripts.
page_details
object
Details of the transcript page

Show 5 properties
transcripts
list of objects
An array of transcripts

Show 7 properties
Errors

400
Bad Request Error

401
Unauthorized Error

404
Not Found Error

429
Too Many Requests Error

500
Internal Server Error

503
Service Unavailable Error

504
Gateway Timeout Error
Was this page helpful?
Yes
No
Previous
Delete transcript
Next
Built with
List transcripts | AssemblyAI | Documentation



Logo
Search
/
Sign In

API Reference
Overview

Files
POST
Upload a media file

Transcripts
POST
Transcribe audio
GET
Get transcript
GET
Get sentences in transcript
GET
Get paragraphs in transcript
GET
Get subtitles for transcript
GET
Get redacted audio
GET
Search words in transcript
GET
List transcripts
DEL
Delete transcript

LeMUR

Streaming API
API Reference
Transcripts
Delete transcript
DELETE
https://api.assemblyai.com/v2/transcript/:transcript_id
DELETE
/v2/transcript/:transcript_id

curl -X DELETE https://api.assemblyai.com \
     -H "Authorization: <apiKey>"
Try it
200
Deleted

{
  "id": "47b95ba5-8889-44d8-bc80-5de38306e582",
  "audio_url": "http://deleted_by_user",
  "status": "completed",
  "language_confidence_threshold": null,
  "language_confidence": null,
  "speech_model": null,
  "webhook_auth": false,
  "auto_highlights": false,
  "redact_pii": false,
  "summarization": false,
  "language_model": "assemblyai_default",
  "acoustic_model": "assemblyai_default",
  "language_code": null,
  "language_detection": false,
  "text": "Deleted by user.",
  "words": null,
  "utterances": null,
  "confidence": null,
  "audio_duration": 390,
  "punctuate": null,
  "format_text": null,
  "disfluencies": true,
  "webhook_url": "http://deleted_by_user",
  "webhook_status_code": null,
  "webhook_auth_header_name": null,
  "auto_highlights_result": null,
  "audio_start_from": null,
  "audio_end_at": null,
  "boost_param": null,
  "filter_profanity": null,
  "redact_pii_audio": null,
  "redact_pii_audio_quality": null,
  "redact_pii_policies": null,
  "redact_pii_sub": null,
  "speaker_labels": null,
  "speakers_expected": null,
  "content_safety": null,
  "content_safety_labels": null,
  "iab_categories": null,
  "iab_categories_result": null,
  "custom_spelling": null,
  "auto_chapters": false,
  "chapters": null,
  "summary_type": null,
  "summary_model": null,
  "summary": null,
  "topics": null,
  "sentiment_analysis": false,
  "sentiment_analysis_results": null,
  "entity_detection": false,
  "entities": null,
  "speech_threshold": null,
  "throttled": null,
  "error": null,
  "dual_channel": null,
  "speed_boost": null,
  "word_boost": null,
  "custom_topics": null
}
To delete your transcriptions on our EU server, replace api.assemblyai.com with api.eu.assemblyai.com.
Remove the data from the transcript and mark it as deleted.

Path parameters
transcript_id
string
Required
ID of the transcript
Headers
Authorization
string
Required
Response
The deleted transcript response
id
string
format: "uuid"
The unique identifier of your transcript
audio_url
string
format: "url"
The URL of the media that was transcribed
status
enum
The status of your transcript. Possible values are queued, processing, completed, or error.
Allowed values:
queued
processing
completed
error
language_confidence_threshold
double or null
The confidence threshold for the automatically detected language. An error will be returned if the language confidence is below this threshold.
language_confidence
double or null
>=0
<=1
The confidence score for the detected language, between 0.0 (low confidence) and 1.0 (high confidence)

speech_model
enum or null
The speech model used for the transcription. When null, the universal model is used.

Allowed values:
best
slam-1
universal
webhook_auth
boolean
Whether webhook authentication details were provided
auto_highlights
boolean
Whether Key Phrases is enabled, either true or false
redact_pii
boolean
Whether PII Redaction is enabled, either true or false

summarization
boolean
Whether Summarization is enabled, either true or false

language_model
string
Deprecated
The language model that was used for the transcript
acoustic_model
string
Deprecated
The acoustic model that was used for the transcript
language_code
enum or null
The language of your audio file. Possible values are found in Supported Languages. The default value is ‘en_us’.


Show 102 enum values
language_detection
boolean or null
Whether Automatic language detection is enabled, either true or false

text
string or null
The textual transcript of your media file
words
list of objects or null
An array of temporally-sequential word objects, one for each word in the transcript. See Speech recognition for more information.


Show 6 properties
utterances
list of objects or null
When multichannel or speaker_labels is enabled, a list of turn-by-turn utterance objects. See Speaker diarization and Multichannel transcription for more information.


Show 7 properties
confidence
double or null
>=0
<=1
The confidence score for the transcript, between 0.0 (low confidence) and 1.0 (high confidence)

audio_duration
integer or null
The duration of this transcript object's media file, in seconds
punctuate
boolean or null
Whether Automatic Punctuation is enabled, either true or false
format_text
boolean or null
Whether Text Formatting is enabled, either true or false
disfluencies
boolean or null
Transcribe Filler Words, like “umm”, in your media file; can be true or false

multichannel
boolean or null
Whether Multichannel transcription was enabled in the transcription request, either true or false

audio_channels
integer or null
The number of audio channels in the audio file. This is only present when multichannel is enabled.
webhook_url
string or null
format: "url"
The URL to which we send webhook requests. We sends two different types of webhook requests. One request when a transcript is completed or failed, and one request when the redacted audio is ready if redact_pii_audio is enabled.

webhook_status_code
integer or null
The status code we received from your server when delivering the transcript completed or failed webhook request, if a webhook URL was provided
webhook_auth_header_name
string or null
The header name to be sent with the transcript completed or failed webhook requests
auto_highlights_result
object or null
An array of results for the Key Phrases model, if it is enabled. See Key Phrases for more information.


Show 2 properties
audio_start_from
integer or null
The point in time, in milliseconds, in the file at which the transcription was started
audio_end_at
integer or null
The point in time, in milliseconds, in the file at which the transcription was terminated
boost_param
string or null
The word boost parameter value
filter_profanity
boolean or null
Whether Profanity Filtering is enabled, either true or false

redact_pii_audio
boolean or null
Whether a redacted version of the audio file was generated, either true or false. See PII redaction for more information.

redact_pii_audio_quality
enum or null
The audio quality of the PII-redacted audio file, if redact_pii_audio is enabled. See PII redaction for more information.

Allowed values:
mp3
wav
redact_pii_policies
list of enums or null
The list of PII Redaction policies that were enabled, if PII Redaction is enabled. See PII redaction for more information.


Show 44 enum values
redact_pii_sub
enum or null
The replacement logic for detected PII, can be entity_type or hash. See PII redaction for more details.

Allowed values:
entity_name
hash
speaker_labels
boolean or null
Whether Speaker diarization is enabled, can be true or false

speakers_expected
integer or null
Tell the speaker label model how many speakers it should attempt to identify, up to 10. See Speaker diarization for more details.

content_safety
boolean or null
Whether Content Moderation is enabled, can be true or false

content_safety_labels
object or null
An array of results for the Content Moderation model, if it is enabled. See Content moderation for more information.


Show 4 properties
iab_categories
boolean or null
Whether Topic Detection is enabled, can be true or false

iab_categories_result
object or null
The result of the Topic Detection model, if it is enabled. See Topic Detection for more information.


Show 3 properties
custom_spelling
list of objects or null
Customize how words are spelled and formatted using to and from values

Show 2 properties
keyterms_prompt
list of strings or null
Improve accuracy with up to 1000 domain-specific words or phrases (maximum 6 words per phrase).

auto_chapters
boolean or null
Whether Auto Chapters is enabled, can be true or false

chapters
list of objects or null
An array of temporally sequential chapters for the audio file

Show 5 properties
summary_type
string or null
The type of summary generated, if Summarization is enabled

summary_model
string or null
The Summarization model used to generate the summary, if Summarization is enabled

summary
string or null
The generated summary of the media file, if Summarization is enabled

topics
list of strings or null
The list of custom topics provided if custom topics is enabled
sentiment_analysis
boolean or null
Whether Sentiment Analysis is enabled, can be true or false

sentiment_analysis_results
list of objects or null
An array of results for the Sentiment Analysis model, if it is enabled. See Sentiment Analysis for more information.


Show 7 properties
entity_detection
boolean or null
Whether Entity Detection is enabled, can be true or false

entities
list of objects or null
An array of results for the Entity Detection model, if it is enabled. See Entity detection for more information.


Show 4 properties
speech_threshold
double or null
Defaults to null. Reject audio files that contain less than this fraction of speech. Valid values are in the range [0, 1] inclusive.

throttled
boolean or null
True while a request is throttled and false when a request is no longer throttled
error
string or null
Error message of why the transcript failed
dual_channel
boolean or null
Deprecated
Whether Dual channel transcription was enabled in the transcription request, either true or false

speed_boost
boolean or null
Deprecated
Whether speed boost is enabled
word_boost
list of strings or null
Deprecated
The list of custom vocabulary to boost transcription probability for
prompt
string or null
Deprecated
This parameter does not currently have any functionality attached to it.
custom_topics
boolean or null
Deprecated
Whether custom topics is enabled, either true or false
Errors

400
Bad Request Error

401
Unauthorized Error

404
Not Found Error

429
Too Many Requests Error

500
Internal Server Error

503
Service Unavailable Error

504
Gateway Timeout Error
Was this page helpful?
Yes
No
Previous
Run a task using LeMUR
Next
Built with
Delete transcript | AssemblyAI | Documentation



Logo
Search
/
Sign In

API Reference
Overview

Files
POST
Upload a media file

Transcripts
POST
Transcribe audio
GET
Get transcript
GET
Get sentences in transcript
GET
Get paragraphs in transcript
GET
Get subtitles for transcript
GET
Get redacted audio
GET
Search words in transcript
GET
List transcripts
DEL
Delete transcript

LeMUR
POST
Run a task using LeMUR
POST
Summarize a transcript using LeMUR
POST
Ask questions using LeMUR
GET
Retrieve LeMUR response
DEL
Purge LeMUR request data

Streaming API
API Reference
LeMUR
Run a task using LeMUR
POST
https://api.assemblyai.com/lemur/v3/generate/task
POST
/lemur/v3/generate/task

curl -X POST https://api.assemblyai.com/lemur/v3/generate/task \
     -H "Authorization: <apiKey>" \
     -H "Content-Type: application/json" \
     -d '{
  "final_model": "anthropic/claude-sonnet-4-20250514",
  "prompt": "List all the locations affected by wildfires.",
  "context": "This is an interview about wildfires.",
  "max_output_size": 3000,
  "temperature": 0,
  "transcript_ids": [
    "64nygnr62k-405c-4ae8-8a6b-d90b40ff3cce"
  ]
}'
Try it
200
Successful

{
  "request_id": "5e1b27c2-691f-4414-8bc5-f14678442f9e",
  "response": "Based on the transcript, the following locations were mentioned as being affected by wildfire smoke from Canada:\n\n- Maine\n- Maryland\n- Minnesota\n- Mid Atlantic region\n- Northeast region\n- New York City\n- Baltimore\n",
  "usage": {
    "input_tokens": 27,
    "output_tokens": 3
  }
}
To use our EU server with LeMUR, replace api.assemblyai.com with api.eu.assemblyai.com.
Use the LeMUR task endpoint to input your own LLM prompt.

Headers
Authorization
string
Required
Request
Params to run the task
final_model
enum
Required
The model that is used for the final prompt after compression is performed.

Show 8 enum values
prompt
string
Required
Your text to prompt the model to produce a desired output, including any context you want to pass into the model.
context
string or map from strings to any
Optional
Context to provide the model. This can be a string or a free-form JSON value.


Show 2 variants
input_text
string
Optional
Custom formatted transcript data. Maximum size is the context limit of the selected model. Use either transcript_ids or input_text as input into LeMUR.

max_output_size
integer
Optional
Defaults to 2000
Max output size in tokens, up to 4000
temperature
double
Optional
The temperature to use for the model. Higher values result in answers that are more creative, lower values are more conservative. Can be any value between 0.0 and 1.0 inclusive.
transcript_ids
list of strings
Optional
A list of completed transcripts with text. Up to a maximum of 100 hours of audio. Use either transcript_ids or input_text as input into LeMUR.

Response
LeMUR task response
request_id
string
format: "uuid"
The ID of the LeMUR request
response
string
The response generated by LeMUR.
usage
object
The usage numbers for the LeMUR request

Show 2 properties
Errors

400
Bad Request Error

401
Unauthorized Error

404
Not Found Error

429
Too Many Requests Error

500
Internal Server Error

503
Service Unavailable Error

504
Gateway Timeout Error
Was this page helpful?
Yes
No
Previous
Summarize a transcript using LeMUR
Next
Built with
Run a task using LeMUR | AssemblyAI | Documentation



Logo
Search
/
Sign In

API Reference
Overview

Files
POST
Upload a media file

Transcripts
POST
Transcribe audio
GET
Get transcript
GET
Get sentences in transcript
GET
Get paragraphs in transcript
GET
Get subtitles for transcript
GET
Get redacted audio
GET
Search words in transcript
GET
List transcripts
DEL
Delete transcript

LeMUR
POST
Run a task using LeMUR
POST
Summarize a transcript using LeMUR
POST
Ask questions using LeMUR
GET
Retrieve LeMUR response
DEL
Purge LeMUR request data

Streaming API
API Reference
LeMUR
Summarize a transcript using LeMUR
POST
https://api.assemblyai.com/lemur/v3/generate/summary
POST
/lemur/v3/generate/summary

curl -X POST https://api.assemblyai.com/lemur/v3/generate/summary \
     -H "Authorization: <apiKey>" \
     -H "Content-Type: application/json" \
     -d '{
  "final_model": "anthropic/claude-sonnet-4-20250514",
  "context": "This is an interview about wildfires.",
  "max_output_size": 3000,
  "temperature": 0,
  "transcript_ids": [
    "47b95ba5-8889-44d8-bc80-5de38306e582"
  ]
}'
Try it
200
Successful

{
  "request_id": "5e1b27c2-691f-4414-8bc5-f14678442f9e",
  "response": "- Wildfires in Canada are sending smoke and air pollution across parts of the US, triggering air quality alerts from Maine to Minnesota. Concentrations of particulate matter have exceeded safety levels.\n\n- Weather systems are channeling the smoke through Pennsylvania into the Mid-Atlantic and Northeast regions. New York City has canceled outdoor activities to keep children and vulnerable groups indoors.\n\n- Very small particulate matter can enter the lungs and impact respiratory, cardiovascular and neurological health. Young children, the elderly and those with preexisting conditions are most at risk.\n\n- The conditions causing the poor air quality could get worse or shift to different areas in coming days depending on weather patterns. More wildfires may also contribute to higher concentrations.\n\n- Climate change is leading to longer and more severe fire seasons. Events of smoke traveling long distances and affecting air quality over wide areas will likely become more common in the future.\"\n",
  "usage": {
    "input_tokens": 27,
    "output_tokens": 3
  }
}
To use our EU server with LeMUR, replace api.assemblyai.com with api.eu.assemblyai.com.
Custom Summary allows you to distill a piece of audio into a few impactful sentences. You can give the model context to obtain more targeted results while outputting the results in a variety of formats described in human language.

Headers
Authorization
string
Required
Request
Params to generate the summary
final_model
enum
Required
The model that is used for the final prompt after compression is performed.

Show 8 enum values
answer_format
string
Optional
How you want the summary to be returned. This can be any text. Examples: “TLDR”, “bullet points”

context
string or map from strings to any
Optional
Context to provide the model. This can be a string or a free-form JSON value.


Show 2 variants
input_text
string
Optional
Custom formatted transcript data. Maximum size is the context limit of the selected model. Use either transcript_ids or input_text as input into LeMUR.

max_output_size
integer
Optional
Defaults to 2000
Max output size in tokens, up to 4000
temperature
double
Optional
The temperature to use for the model. Higher values result in answers that are more creative, lower values are more conservative. Can be any value between 0.0 and 1.0 inclusive.
transcript_ids
list of strings
Optional
A list of completed transcripts with text. Up to a maximum of 100 hours of audio. Use either transcript_ids or input_text as input into LeMUR.

Response
LeMUR summary response
request_id
string
format: "uuid"
The ID of the LeMUR request
response
string
The response generated by LeMUR.
usage
object
The usage numbers for the LeMUR request

Show 2 properties
Errors

400
Bad Request Error

401
Unauthorized Error

404
Not Found Error

429
Too Many Requests Error

500
Internal Server Error

503
Service Unavailable Error

504
Gateway Timeout Error
Was this page helpful?
Yes
No
Previous
Ask questions using LeMUR
Next
Built with
Summarize a transcript using LeMUR | AssemblyAI | Documentation



Logo
Search
/
Sign In

API Reference
Overview

Files
POST
Upload a media file

Transcripts
POST
Transcribe audio
GET
Get transcript
GET
Get sentences in transcript
GET
Get paragraphs in transcript
GET
Get subtitles for transcript
GET
Get redacted audio
GET
Search words in transcript
GET
List transcripts
DEL
Delete transcript

LeMUR
POST
Run a task using LeMUR
POST
Summarize a transcript using LeMUR
POST
Ask questions using LeMUR
GET
Retrieve LeMUR response
DEL
Purge LeMUR request data

Streaming API
API Reference
LeMUR
Ask questions using LeMUR
POST
https://api.assemblyai.com/lemur/v3/generate/question-answer
POST
/lemur/v3/generate/question-answer

curl -X POST https://api.assemblyai.com/lemur/v3/generate/question-answer \
     -H "Authorization: <apiKey>" \
     -H "Content-Type: application/json" \
     -d '{
  "final_model": "anthropic/claude-sonnet-4-20250514",
  "questions": [
    {
      "question": "Where are there wildfires?",
      "answer_format": "List of countries in ISO 3166-1 alpha-2 format",
      "answer_options": [
        "US",
        "CA"
      ]
    },
    {
      "question": "Is global warming affecting wildfires?",
      "answer_options": [
        "yes",
        "no"
      ]
    }
  ],
  "context": "This is an interview about wildfires.",
  "max_output_size": 3000,
  "temperature": 0,
  "transcript_ids": [
    "64nygnr62k-405c-4ae8-8a6b-d90b40ff3cce"
  ]
}'
Try it
200
Successful

{
  "request_id": "5e1b27c2-691f-4414-8bc5-f14678442f9e",
  "response": [
    {
      "question": "Where are there wildfires?",
      "answer": "CA, US"
    },
    {
      "question": "Is global warming affecting wildfires?",
      "answer": "yes"
    }
  ],
  "usage": {
    "input_tokens": 27,
    "output_tokens": 3
  }
}
To use our EU server with LeMUR, replace api.assemblyai.com with api.eu.assemblyai.com.
Question & Answer allows you to ask free-form questions about a single transcript or a group of transcripts. The questions can be any whose answers you find useful, such as judging whether a caller is likely to become a customer or whether all items on a meeting’s agenda were covered.

Headers
Authorization
string
Required
Request
Params to ask questions about the transcripts
final_model
enum
Required
The model that is used for the final prompt after compression is performed.

Show 8 enum values
questions
list of objects
Required
A list of questions to ask

Show 4 properties
context
string or map from strings to any
Optional
Context to provide the model. This can be a string or a free-form JSON value.


Show 2 variants
input_text
string
Optional
Custom formatted transcript data. Maximum size is the context limit of the selected model. Use either transcript_ids or input_text as input into LeMUR.

max_output_size
integer
Optional
Defaults to 2000
Max output size in tokens, up to 4000
temperature
double
Optional
The temperature to use for the model. Higher values result in answers that are more creative, lower values are more conservative. Can be any value between 0.0 and 1.0 inclusive.
transcript_ids
list of strings
Optional
A list of completed transcripts with text. Up to a maximum of 100 hours of audio. Use either transcript_ids or input_text as input into LeMUR.

Response
LeMUR question & answer response

request_id
string
format: "uuid"
The ID of the LeMUR request
response
list of objects
The answers generated by LeMUR and their questions

Show 2 properties
usage
object
The usage numbers for the LeMUR request

Show 2 properties
Errors

400
Bad Request Error

401
Unauthorized Error

404
Not Found Error

429
Too Many Requests Error

500
Internal Server Error

503
Service Unavailable Error

504
Gateway Timeout Error
Was this page helpful?
Yes
No
Previous
Retrieve LeMUR response
Next
Built with
Ask questions using LeMUR | AssemblyAI | Documentation



Logo
Search
/
Sign In

API Reference
Overview

Files
POST
Upload a media file

Transcripts
POST
Transcribe audio
GET
Get transcript
GET
Get sentences in transcript
GET
Get paragraphs in transcript
GET
Get subtitles for transcript
GET
Get redacted audio
GET
Search words in transcript
GET
List transcripts
DEL
Delete transcript

LeMUR
POST
Run a task using LeMUR
POST
Summarize a transcript using LeMUR
POST
Ask questions using LeMUR
GET
Retrieve LeMUR response
DEL
Purge LeMUR request data

Streaming API
API Reference
LeMUR
Retrieve LeMUR response
GET
https://api.assemblyai.com/lemur/v3/:request_id
GET
/lemur/v3/:request_id

curl https://api.assemblyai.com/lemur/v3/request_id \
     -H "Authorization: <apiKey>"
Try it
200
Retrieved

{
  "response": "foo",
  "request_id": "foo",
  "usage": {
    "input_tokens": 42,
    "output_tokens": 42
  }
}
To use our EU server with LeMUR, replace api.assemblyai.com with api.eu.assemblyai.com.
Retrieve a LeMUR response that was previously generated.

Path parameters
request_id
string
Required
The ID of the LeMUR request you previously made. This would be found in the response of the original request.
Headers
Authorization
string
Required
Response
LeMUR response
object

Show 3 properties
OR
object

Show 3 properties
Errors

400
Bad Request Error

401
Unauthorized Error

404
Not Found Error

429
Too Many Requests Error

500
Internal Server Error

503
Service Unavailable Error

504
Gateway Timeout Error
Was this page helpful?
Yes
No
Previous
Purge LeMUR request data
Next
Built with
Retrieve LeMUR response | AssemblyAI | Documentation



Logo
Search
/
Sign In

API Reference
Overview

Files
POST
Upload a media file

Transcripts
POST
Transcribe audio
GET
Get transcript
GET
Get sentences in transcript
GET
Get paragraphs in transcript
GET
Get subtitles for transcript
GET
Get redacted audio
GET
Search words in transcript
GET
List transcripts
DEL
Delete transcript

LeMUR
POST
Run a task using LeMUR
POST
Summarize a transcript using LeMUR
POST
Ask questions using LeMUR
GET
Retrieve LeMUR response
DEL
Purge LeMUR request data

Streaming API
API Reference
LeMUR
Purge LeMUR request data
DELETE
https://api.assemblyai.com/lemur/v3/:request_id
DELETE
/lemur/v3/:request_id

curl -X DELETE https://api.assemblyai.com/lemur/v3/request_id \
     -H "Authorization: <apiKey>"
Try it
200
Deleted

{
  "request_id": "914fe7e4-f10a-4364-8946-34614c2873f6",
  "request_id_to_purge": "b7eb03ec-1650-4181-949b-75d9de317de1",
  "deleted": true
}
To use our EU server with LeMUR, replace api.assemblyai.com with api.eu.assemblyai.com.
Delete the data for a previously submitted LeMUR request. The LLM response data, as well as any context provided in the original request will be removed.

Path parameters
request_id
string
Required
The ID of the LeMUR request whose data you want to delete. This would be found in the response of the original request.
Headers
Authorization
string
Required
Response
LeMUR request data deleted
request_id
string
format: "uuid"
The ID of the deletion request of the LeMUR request
request_id_to_purge
string
format: "uuid"
The ID of the LeMUR request to purge the data for
deleted
boolean
Whether the request data was deleted
Errors

400
Bad Request Error

401
Unauthorized Error

404
Not Found Error

429
Too Many Requests Error

500
Internal Server Error

503
Service Unavailable Error

504
Gateway Timeout Error
Was this page helpful?
Yes
No
Previous
Generate temporary streaming token
Next
Built with
Purge LeMUR request data | AssemblyAI | Documentation



Logo
Search
/
Sign In

API Reference
Overview

Files

Transcripts

LeMUR

Streaming API
GET
Generate temporary streaming token
WSS
Streaming API
API Reference
Streaming API
Generate temporary streaming token
GET
https://streaming.assemblyai.com/v3/token
GET
/v3/token

curl https://streaming.assemblyai.com/v3/token \
     -H "Authorization: <apiKey>"
Try it
200
Retrieved

{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in_seconds": 60
}
Generates a temporary authentication token for use with streaming services.
Headers
Authorization
string
Required
Query parameters
expires_in_seconds
integer
Optional
>=1
<=600
The desired expiration time for the token in seconds.
max_session_duration_seconds
integer
Optional
>=1
The desired maximum duration for the session started using this token in seconds.
Response
Successfully generated temporary token
token
string
The temporary authentication token
expires_in_seconds
integer
The actual expiration time of the token in seconds.
Errors

400
Bad Request Error

401
Unauthorized Error

429
Too Many Requests Error

500
Internal Server Error
Was this page helpful?
Yes
No
Previous
Streaming API
Next
Built with
Generate temporary streaming token | AssemblyAI | Documentation


Logo
Search
/
Sign In

API Reference
Overview

Files

Transcripts

LeMUR

Streaming API
GET
Generate temporary streaming token
WSS
Streaming API
API Reference
Streaming API
Streaming API
WSS
wss://streaming.assemblyai.com/v3/ws
Handshake
URL	wss://streaming.assemblyai.com/v3/ws
Method	GET
Status	101 Switching Protocols
Try it
Messages

{"type":"Begin","id":"cfd280c7-5a9b-4dd6-8c05-235ccfa3c97f","expires_at":1745483367}
sessionBegins


"Y3VyaW91cyBtaW5k"
audioChunk


"cyB0aGluayBhbGlrZSA6KQ=="
audioChunk

Main channel for bi-directional audio and transcription data

Handshake
WSS
wss://streaming.assemblyai.com/v3/ws

Headers
Authorization
string
Optional
Use your API key for authentication, or alternatively generate a temporary token and pass it via the token query parameter.

Query parameters
sample_rate
string
Required
Sample rate of the audio stream
encoding
enum
Optional
Defaults to pcm_s16le
Encoding of the audio stream
Allowed values:
pcm_s16le
pcm_mulaw
token
string
Optional
API token for authentication
format_turns
enum
Optional
Defaults to false
Whether to return formatted final transcripts
Allowed values:
true
false
end_of_turn_confidence_threshold
string
Optional
Defaults to 0.7
The confidence threshold (0.0 to 1.0) to use when determining if the end of a turn has been reached

min_end_of_turn_silence_when_confident
string
Optional
format: "ms"
Defaults to 160
The minimum amount of silence in milliseconds required to detect end of turn when confident
max_turn_silence
string
Optional
format: "ms"
Defaults to 2400
The maximum amount of silence in milliseconds allowed in a turn before end of turn is triggered
Send
sendAudio
any
Required
Send audio data chunks for transcription. The payload must be of type bytes and contain audio data between 50ms and 1000ms in length.
OR
sendUpdateConfiguration
object
Required
Update streaming configuration parameters during an active session.

Show 4 properties
OR
sendForceEndpoint
object
Required
Manually force an endpoint in the transcription.

Show 1 properties
OR
sendSessionTermination
object
Required
Gracefully terminate the streaming session.

Show 1 properties
Receive
receiveSessionBegins
object
Required
Receive confirmation that the streaming session has successfully started.

Show 3 properties
OR
receiveTurn
object
Required
Receive a formatted turn-based transcription result.


Show 7 properties
OR
receiveTermination
object
Required
Receive confirmation that the session has been terminated by the server.

Show 3 properties
Was this page helpful?
Yes
No
Previous
Built with
Streaming API | AssemblyAI | Documentation