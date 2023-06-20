require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const uuid = require("uuid");
const mongo = require("mongodb");
const MongoClient = require('mongodb').MongoClient;
const startCoreProducer = require('./producers/coreProducer');


startCoreProducer();

