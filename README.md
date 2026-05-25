# DNSUpdater

<p align="center">
    <a href="LICENSE">
        <img src="https://img.shields.io/badge/license-MIT-brightgreen.svg" alt="MIT License">
    </a>
    <a href="https://www.typescriptlang.org/" target="_blank" rel="noopener noreferrer">
        <img src="https://img.shields.io/badge/typescript-5.3-blue.svg" alt="TypeScript 5.3">
    </a>
    <a href="https://nextjs.org" target="_blank" rel="noopener noreferrer">
        <img src="https://img.shields.io/badge/Next.js-14-black.svg" alt="Next.js 14">
    </a>
</p>


This package allows you to set up a service that updates DNS records using the DigitalOcean API. Its main purpose is being a target for other clients that only allow GET requests to send updates to DDNS services, e.g., routers like  Fritz!Box.

It is based on the Swift version created by Florian Fittschen (https://github.com/ffittschen/DNSUpdater). Thanks a lot for the really cool implementation that served me well for years until it broke because of unsupported encryption versions everyone stopped supporting.

Swift code is still unfamiliar to me, so I quickly had do give up when trying to 
vibecode the upgrade to a recent Swift stack. I then decided to just fall back to 
TypeScript. And this is where we are now.

## Usage

### Build and Run with Docker Compose

First, you need to create a `.env` file (copy cand change .env.sample):
```
USERNAME=john_doe
PASSWORD=change_this_to_some_secure_password
API_KEY=your_digitalocean_api_key
```

`USERNAME` and `PASSWORD` are used inside te TypeScript code to validate the credentials provided by your router. `API_KEY` is the DigitalOcean API key. The suggested configuration on DigitalOcean is to only provide the following permissions on an API access token:
- domain / read
- domain / update

```bash
docker compose build

docker compose up -d
```

You can test your setup by running this `curl` command using `bash`.

```sh

# Use a subshell to source the .env file safely
(export $(grep -v '^#' .env | xargs) && curl -i -u "$USERNAME:$PASSWORD" "http://localhost:3000/api/v1/domains/updateRecord?domain=example.com&subdomain=test&ip=1.2.3.4")
```

Where the DNS entry on DigitalOcean looks like `subdomain.example.com`.

## Ports

|  Port  | Description               |
|:------:|---------------------------|
| 3000/TCP | API to update DNS records - you can change to a port of your liking in the docker-compose.yml file |

## API

DNSUpdater provides a very simple interface, it only has one path: `/api/v1/domains/updateRecord`. To update a DNS record of a domain, you need to execute a `GET` request targeting the mentioned path and provide a few query parameters:

|Parameter | Type |Description |
|----------|:----:|------------|
|domain    |string|The name of the domain as it is managed by DigitalOcean, e.g., `example.com`|
|recordName|string|The name of the A record of the domain. If your subdomain is `foo.example.com`, the record name is `foo`.|
|ip        |string|The dynamic IP address to which the A record should point, e.g., `1.2.3.4`|

In addition to the query parameters, you need to authenticate the request using basic auth with the username and password provided as environment variables to the docker container:

| Header Name   | Header Value |
|---------------|--------------|
| Authorization | Basic am9obl9kb2U6c29tZV9zZWN1cmVfcGFzc3dvcmQ= |

The header value is the username and password concatenated with a colon as separator and then encoded to base64. You can create the string by calling this command in your terminal (or, like in the above example, rely on `curl` managing the credential encoding for you):

```bash
echo -n john_doe:some_secure_password | base64
```

## Prerequisites
Since this is a DNS _Updater_, you need to make sure that a record with the name that you pass as a query parameter already exists in your DigitalOcean account.

# Future improvements
Implement an improvement to expose IPv6 devices in the home network by providing a list of MAC addresses and supporting updates of the prefix via URLs like https://[update-url]?hostname=<domain>&myip=<ipaddr>,<ip6addr>&ipv6prefix=<ip6lanprefix>.
