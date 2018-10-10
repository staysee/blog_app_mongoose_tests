'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');

const expect = chai.expect;

const {BlogPost} = require('../models');
const {app, runServer, closeServer} = require('../server');
const {TEST_DATABASE_URL} = require('../config');

chai.use(chaiHttp);

function seedBlogPostData(){
	console.info('seeding blogpost data');
	const seedData = [];

	for(let i=1; i<=10; i++){
		seedData.push({
			title: faker.lorem.sentence(),
			content: faker.lorem.paragraph(),
			author: {
				firstName: faker.name.firstName(),
				lastName: faker.name.lastName()
			}
		})
	}
	return BlogPost.insertMany(seedData);
}

function tearDownDb(){
	console.warn('Deleting database');
	return mongoose.connection.dropDatabase();
}

describe('Blog Posts API resource', function(){
	before(function(){
		return runServer(TEST_DATABASE_URL);
	})

	beforeEach(function() {
		return seedBlogPostData();
	})

	afterEach(function() {
		return tearDownDb();
	})

	after(function() {
		return closeServer();
	})

	describe('GET endpoint', function() {
		it('should return all existing blogposts', function() {

			let res;
			return chai.request(app)
				.get('/posts')
				.then(function(_res){
					res = _res;
					expect(res).to.have.status(200);
					console.info(res.body);
					expect(res.body).to.have.lengthOf.at.least(1);
					return BlogPost.count();
				})
				.then(function(count) {
					expect(res.body).to.have.lengthOf(count);
				})
		})

		it('should return blogposts with the right fields', function() {

			let resBlogPost;
			return chai.request(app)
				.get('/posts')
				.then(function(res) {
					expect(res).to.have.status(200);
					expect(res).to.be.json;
					expect(res.body).to.be.a('array');
					expect(res.body).to.have.lengthOf.at.least(1);

					res.body.forEach(function(post) {
						expect(post).to.be.a('object');
						expect(post).to.include.keys('id', 'title', 'content', 'author', 'created');
					});
					resBlogPost = res.body[0];
					return BlogPost.findById(resBlogPost.id);
				})
				.then(function(post) {
					console.info(resBlogPost);
					console.info(post);
					expect(resBlogPost.title).to.equal(post.title);
					expect(resBlogPost.content).to.equal(post.content);
					expect(resBlogPost.author).to.equal(post.author);
				})
		})
	})

	describe('POST endpoint', function() {
		it('should add a new post', function() {

			const newBlogPost = {
				title: faker.lorem.sentence(),
				content: faker.lorem.paragraph(),
				author: {
					firstName: faker.name.firstName(),
					lastName: faker.name.lastName()
				}
			}

			return chai.request(app)
				.post('/posts')
				.send(newBlogPost)
				.then(function(res) {
					expect(res).to.have.status(201);
					expect(res).to.be.json;
					expect(res.body).to.be.a('object');
					expect(res.body).to.include.keys('id', 'title', 'content', 'author', 'created');
					expect(res.body.title).to.equal(newBlogPost.title);
					expect(res.body.content).to.equal(newBlogPost.content);
					expect(res.body.author).to.equal(`${newBlogPost.author.firstName} ${newBlogPost.author.lastName}`);

					return BlogPost.findById(res.body.id);
				})
				.then(function(post) {
					expect(post.title).to.equal(newBlogPost.title);
					expect(post.content).to.equal(newBlogPost.content);
					expect(post.author.firstName).to.equal(newBlogPost.author.firstName);
					expect(post.author.lastName).to.equal(newBlogPost.author.lastName);
				})
		})
	})

	describe('PUT endpoint', function() {
		it('should update fields you send over', function() {
			const updateData = {
				title: 'This is an Updated Title',
				content: 'Updating the content.'
			};

			return BlogPost
				.findOne()
				.then(function(post) {
					updateData.id = post.id;

					return chai.request(app)
						.put(`/posts/${post.id}`)
						.send(updateData);
				})
				.then(function(res) {
					expect(res).to.have.status(204);

					return BlogPost.findById(updateData.id);
				})
				.then(function(post) {
					expect(post.title).to.equal(updateData.title);
					expect(post.content).to.equal(updateData.content);
				})
		})
	})

	describe('DELETE endpoing', function() {
		it('delete a restaurant by id', function() {

			let post;

			return BlogPost
				.findOne()
				.then(function(_post) {
					post = _post;
					return chai.request(app).delete(`/posts/${post.id}`);
				})
				.then(function(res) {
					expect(res).to.have.status(204);
					return BlogPost.findById(post.id);
				})
				.then(function(_post) {
					expect(_post).to.be.null;
				})
		})
	})
})




















