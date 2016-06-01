/**
 * @author zz85 / http://www.lab4games.net/zz85/blog
 * Creates free form 2d path using series of points, lines or curves.
 *
 **/

THREE.Path = function( points ) {

	THREE.CurvePath.call( this );

	this.actions = [];

	if ( points ) {

		this.fromPoints( points );

	}

};

THREE.Path.prototype = Object.assign( Object.create( THREE.CurvePath.prototype ), {

	constructor: THREE.Path,

	// TODO Clean up PATH API

	// Create path using straight lines to connect all points
	// - vectors: array of Vector2

	fromPoints: function( vectors ) {

		this.moveTo( vectors[ 0 ].x, vectors[ 0 ].y );

		for ( var i = 1, l = vectors.length; i < l; i ++ ) {

			this.lineTo( vectors[ i ].x, vectors[ i ].y );

		}

	},

	moveTo: function( x, y ) {

		this.actions.push( { action: 'moveTo', args: [ x, y ] } );

	},

	lineTo: function( x, y ) {

		var lastargs = this.actions[ this.actions.length - 1 ].args;

		var x0 = lastargs[ lastargs.length - 2 ];
		var y0 = lastargs[ lastargs.length - 1 ];

		var curve = new THREE.LineCurve( new THREE.Vector2( x0, y0 ), new THREE.Vector2( x, y ) );
		this.curves.push( curve );

		this.actions.push( { action: 'lineTo', args: [ x, y ] } );

	},

	quadraticCurveTo: function( aCPx, aCPy, aX, aY ) {

		var lastargs = this.actions[ this.actions.length - 1 ].args;

		var x0 = lastargs[ lastargs.length - 2 ];
		var y0 = lastargs[ lastargs.length - 1 ];

		var curve = new THREE.QuadraticBezierCurve(
			new THREE.Vector2( x0, y0 ),
			new THREE.Vector2( aCPx, aCPy ),
			new THREE.Vector2( aX, aY )
		);

		this.curves.push( curve );

		this.actions.push( { action: 'quadraticCurveTo', args: [ aCPx, aCPy, aX, aY ] } );

	},

	bezierCurveTo: function( aCP1x, aCP1y, aCP2x, aCP2y, aX, aY ) {

		var lastargs = this.actions[ this.actions.length - 1 ].args;

		var x0 = lastargs[ lastargs.length - 2 ];
		var y0 = lastargs[ lastargs.length - 1 ];

		var curve = new THREE.CubicBezierCurve(
			new THREE.Vector2( x0, y0 ),
			new THREE.Vector2( aCP1x, aCP1y ),
			new THREE.Vector2( aCP2x, aCP2y ),
			new THREE.Vector2( aX, aY )
		);

		this.curves.push( curve );

		this.actions.push( { action: 'bezierCurveTo', args: [ aCP1x, aCP1y, aCP2x, aCP2y, aX, aY ] } );

	},

	splineThru: function( pts /*Array of Vector*/ ) {

		var args = Array.prototype.slice.call( arguments );

		var lastargs = this.actions[ this.actions.length - 1 ].args;

		var x0 = lastargs[ lastargs.length - 2 ];
		var y0 = lastargs[ lastargs.length - 1 ];

		var npts = [ new THREE.Vector2( x0, y0 ) ];
		Array.prototype.push.apply( npts, pts );

		var curve = new THREE.SplineCurve( npts );
		this.curves.push( curve );

		var lastPoint = pts[ pts.length - 1 ];
		args.push( lastPoint.x );
		args.push( lastPoint.y );
		this.actions.push( { action: 'splineThru', args: args } );

	},

	arc: function( aX, aY, aRadius, aStartAngle, aEndAngle, aClockwise ) {

		var lastargs = this.actions[ this.actions.length - 1 ].args;
		var x0 = lastargs[ lastargs.length - 2 ];
		var y0 = lastargs[ lastargs.length - 1 ];

		this.absarc( aX + x0, aY + y0, aRadius,
			aStartAngle, aEndAngle, aClockwise );

	},

	absarc: function( aX, aY, aRadius, aStartAngle, aEndAngle, aClockwise ) {

		this.absellipse( aX, aY, aRadius, aRadius, aStartAngle, aEndAngle, aClockwise );

	},

	ellipse: function( aX, aY, xRadius, yRadius, aStartAngle, aEndAngle, aClockwise, aRotation ) {

		var lastargs = this.actions[ this.actions.length - 1 ].args;
		var x0 = lastargs[ lastargs.length - 2 ];
		var y0 = lastargs[ lastargs.length - 1 ];

		this.absellipse( aX + x0, aY + y0, xRadius, yRadius, aStartAngle, aEndAngle, aClockwise, aRotation );

	},

	absellipse: function( aX, aY, xRadius, yRadius, aStartAngle, aEndAngle, aClockwise, aRotation ) {

		var args = [
			aX, aY,
			xRadius, yRadius,
			aStartAngle, aEndAngle,
			aClockwise,
			aRotation || 0 // aRotation is optional.
		];

		var curve = new THREE.EllipseCurve( aX, aY, xRadius, yRadius, aStartAngle, aEndAngle, aClockwise, aRotation );
		var firstPoint = curve.getPoint( 0 );

		if ( this.actions.length !== 0 ) {

			var lastargs = this.actions[ this.actions.length - 1 ].args;
			var x0 = lastargs[ lastargs.length - 2 ];
			var y0 = lastargs[ lastargs.length - 1 ];
			var pt0 = new THREE.Vector2( x0, y0 );

			//if ( pt0.distanceTo( firstPoint ) > Number.EPSILON ) {
			if ( ! pt0.equals( firstPoint ) ) {

				this.lineTo( firstPoint.x, firstPoint.y );

			}

		}

		this.curves.push( curve );

		var lastPoint = curve.getPoint( 1 );
		args.push( lastPoint.x );
		args.push( lastPoint.y );

		this.actions.push( { action: 'ellipse', args: args } );

	},

	getSpacedPoints: function( divisions ) {

		if ( ! divisions ) divisions = 40;

		var points = [];

		for ( var i = 0; i <= divisions; i ++ ) {

			points.push( this.getPoint( i / divisions ) );

			//if ( !this.getPoint( i / divisions ) ) throw "DIE";

		}

		if ( this.autoClose ) {

			points.push( points[ 0 ] );

		}

		return points;

	},

	getPoints: function( divisions ) {

		function isDifferentPoint( pt1, pt2 ) {

			if ( pt1 === null ) return true;

			//if ( Math.abs( pt1.x - pt2.x) > Number.EPSILON ||
			//     Math.abs( pt1.y - pt2.y) > Number.EPSILON ) {

			if ( pt1.distanceTo( pt2 ) > Number.EPSILON ) {

			//if ( !pt1.equals( pt2 ) ) {

				return true;

			}

			return false;

		}


		divisions = divisions || 12;

		var points = [];
		var lastPoint = null, nextPoint;
		var iCurve = 0, nbCurves = this.curves.length;

		for ( var iAction = 0, l = this.actions.length; iAction < l; iAction ++ ) {

			var item = this.actions[ iAction ];
			var action = item.action;
			var args = item.args;

			var curve = null;
			if ( iCurve < nbCurves ) {

				curve = this.curves[ iCurve ];

			}

			switch ( action ) {

			case 'moveTo':

				lastPoint = new THREE.Vector2( args[ 0 ], args[ 1 ] );
				points.push( lastPoint );

				break;

			case 'lineTo':

				nextPoint = curve.getPoint( 1 );
				if ( isDifferentPoint( lastPoint, nextPoint ) ) {

					points.push( nextPoint );
					lastPoint = nextPoint;

				}
				iCurve ++;

				break;

			case 'quadraticCurveTo':
			case 'bezierCurveTo':
			//case 'splineThru':
			case 'ellipse':

				for ( var j = 0; j <= divisions; j ++ ) {

					nextPoint = curve.getPoint( j / divisions );
					if ( isDifferentPoint( lastPoint, nextPoint ) ) {

						points.push( nextPoint );
						lastPoint = nextPoint;

					}

				}
				iCurve ++;

				break;

			case 'splineThru':

				var n = divisions * args[ 0 ].length;
				for ( var j = 0; j <= n; j ++ ) {

					nextPoint = curve.getPointAt( j / n );
					if ( isDifferentPoint( lastPoint, nextPoint ) ) {

						points.push( nextPoint );
						lastPoint = nextPoint;

					}

				}
				iCurve ++;

				break;

			} // end switch

		}


		// If there is a least 2 points in the path.
		if ( points.length > 1 ) {

			var firstPoint = points[ 0 ];

			// Normalize to remove the closing point by default.
			// This is required by THREE.ShapeUtils but is not documented and may
			// be looked as a problem for other usage.
			if ( Math.abs( lastPoint.x - firstPoint.x ) < Number.EPSILON &&
			     Math.abs( lastPoint.y - firstPoint.y ) < Number.EPSILON )
			points.splice( points.length - 1, 1 );

			// Close the path if required
			if ( this.autoClose ) {

				if ( isDifferentPoint( lastPoint, firstPoint ) ) {

					// Close the path
					points.push( firstPoint );

				} else {

					// Be shure to have the exact same point and both ends of the path
					points[ points.length - 1 ] = firstPoint;

				}

			}

		}

		return points;

	},

	toShapes: function( isCCW, noHoles ) {

		function extractSubpaths( inActions ) {

			var subPaths = [], lastPath = new THREE.Path();

			for ( var i = 0, l = inActions.length; i < l; i ++ ) {

				var item = inActions[ i ];

				var args = item.args;
				var action = item.action;

				if ( action === 'moveTo' ) {

					if ( lastPath.actions.length !== 0 ) {

						subPaths.push( lastPath );
						lastPath = new THREE.Path();

					}

				}

				lastPath[ action ].apply( lastPath, args );

			}

			if ( lastPath.actions.length !== 0 ) {

				subPaths.push( lastPath );

			}

			// console.log(subPaths);

			return	subPaths;

		}

		function toShapesNoHoles( inSubpaths ) {

			var shapes = [];

			for ( var i = 0, l = inSubpaths.length; i < l; i ++ ) {

				var tmpPath = inSubpaths[ i ];

				var tmpShape = new THREE.Shape();
				tmpShape.actions = tmpPath.actions;
				tmpShape.curves = tmpPath.curves;

				shapes.push( tmpShape );

			}

			//console.log("shape", shapes);

			return shapes;

		}

		function isPointInsidePolygon( inPt, inPolygon ) {

			var polyLen = inPolygon.length;

			// inPt on polygon contour => immediate success    or
			// toggling of inside/outside at every single! intersection point of an edge
			//  with the horizontal line through inPt, left of inPt
			//  not counting lowerY endpoints of edges and whole edges on that line
			var inside = false;
			for ( var p = polyLen - 1, q = 0; q < polyLen; p = q ++ ) {

				var edgeLowPt = inPolygon[ p ];
				var edgeHighPt = inPolygon[ q ];

				var edgeDx = edgeHighPt.x - edgeLowPt.x;
				var edgeDy = edgeHighPt.y - edgeLowPt.y;

				if ( Math.abs( edgeDy ) > Number.EPSILON ) {

					// not parallel
					if ( edgeDy < 0 ) {

						edgeLowPt = inPolygon[ q ]; edgeDx = - edgeDx;
						edgeHighPt = inPolygon[ p ]; edgeDy = - edgeDy;

					}
					if ( ( inPt.y < edgeLowPt.y ) || ( inPt.y > edgeHighPt.y ) ) continue;

					if ( inPt.y === edgeLowPt.y ) {

						if ( inPt.x === edgeLowPt.x ) return	true; // inPt is on contour ?
						// continue;				// no intersection or edgeLowPt => doesn't count !!!

					} else {

						var perpEdge = edgeDy * ( inPt.x - edgeLowPt.x ) - edgeDx * ( inPt.y - edgeLowPt.y );
						if ( perpEdge === 0 ) return	true; // inPt is on contour ?
						if ( perpEdge < 0 ) continue;
						inside = ! inside; // true intersection left of inPt

					}

				} else {

					// parallel or collinear
					if ( inPt.y !== edgeLowPt.y ) continue; // parallel
					// edge lies on the same horizontal line as inPt
					if ( ( ( edgeHighPt.x <= inPt.x ) && ( inPt.x <= edgeLowPt.x ) ) ||
						 ( ( edgeLowPt.x <= inPt.x ) && ( inPt.x <= edgeHighPt.x ) ) ) return	true;	// inPt: Point on contour !
					// continue;

				}

			}

			return	inside;

		}

		var isClockWise = THREE.ShapeUtils.isClockWise;

		var subPaths = extractSubpaths( this.actions );
		if ( subPaths.length === 0 ) return [];

		if ( noHoles === true )	return	toShapesNoHoles( subPaths );


		var solid, tmpPath, tmpShape, shapes = [];

		if ( subPaths.length === 1 ) {

			tmpPath = subPaths[ 0 ];
			tmpShape = new THREE.Shape();
			tmpShape.actions = tmpPath.actions;
			tmpShape.curves = tmpPath.curves;
			shapes.push( tmpShape );
			return shapes;

		}

		var holesFirst = ! isClockWise( subPaths[ 0 ].getPoints() );
		holesFirst = isCCW ? ! holesFirst : holesFirst;

		// console.log("Holes first", holesFirst);

		var betterShapeHoles = [];
		var newShapes = [];
		var newShapeHoles = [];
		var mainIdx = 0;
		var tmpPoints;

		newShapes[ mainIdx ] = undefined;
		newShapeHoles[ mainIdx ] = [];

		for ( var i = 0, l = subPaths.length; i < l; i ++ ) {

			tmpPath = subPaths[ i ];
			tmpPoints = tmpPath.getPoints();
			solid = isClockWise( tmpPoints );
			solid = isCCW ? ! solid : solid;

			if ( solid ) {

				if ( ( ! holesFirst ) && ( newShapes[ mainIdx ] ) )	mainIdx ++;

				newShapes[ mainIdx ] = { s: new THREE.Shape(), p: tmpPoints };
				newShapes[ mainIdx ].s.actions = tmpPath.actions;
				newShapes[ mainIdx ].s.curves = tmpPath.curves;

				if ( holesFirst )	mainIdx ++;
				newShapeHoles[ mainIdx ] = [];

				//console.log('cw', i);

			} else {

				newShapeHoles[ mainIdx ].push( { h: tmpPath, p: tmpPoints[ 0 ] } );

				//console.log('ccw', i);

			}

		}

		// only Holes? -> probably all Shapes with wrong orientation
		if ( ! newShapes[ 0 ] )	return	toShapesNoHoles( subPaths );


		if ( newShapes.length > 1 ) {

			var ambiguous = false;
			var toChange = [];

			for ( var sIdx = 0, sLen = newShapes.length; sIdx < sLen; sIdx ++ ) {

				betterShapeHoles[ sIdx ] = [];

			}

			for ( var sIdx = 0, sLen = newShapes.length; sIdx < sLen; sIdx ++ ) {

				var sho = newShapeHoles[ sIdx ];

				for ( var hIdx = 0; hIdx < sho.length; hIdx ++ ) {

					var ho = sho[ hIdx ];
					var hole_unassigned = true;

					for ( var s2Idx = 0; s2Idx < newShapes.length; s2Idx ++ ) {

						if ( isPointInsidePolygon( ho.p, newShapes[ s2Idx ].p ) ) {

							if ( sIdx !== s2Idx )	toChange.push( { froms: sIdx, tos: s2Idx, hole: hIdx } );
							if ( hole_unassigned ) {

								hole_unassigned = false;
								betterShapeHoles[ s2Idx ].push( ho );

							} else {

								ambiguous = true;

							}

						}

					}
					if ( hole_unassigned ) {

						betterShapeHoles[ sIdx ].push( ho );

					}

				}

			}
			// console.log("ambiguous: ", ambiguous);
			if ( toChange.length > 0 ) {

				// console.log("to change: ", toChange);
				if ( ! ambiguous )	newShapeHoles = betterShapeHoles;

			}

		}

		var tmpHoles;

		for ( var i = 0, il = newShapes.length; i < il; i ++ ) {

			tmpShape = newShapes[ i ].s;
			shapes.push( tmpShape );
			tmpHoles = newShapeHoles[ i ];

			for ( var j = 0, jl = tmpHoles.length; j < jl; j ++ ) {

				tmpShape.holes.push( tmpHoles[ j ].h );

			}

		}

		//console.log("shape", shapes);

		return shapes;

	}

} );
