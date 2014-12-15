(function(fc) {
    'use strict';

    /**
    * This component can be used to generate mock/fake daily market data for use with the chart
    * data series components. This component does not act on a D3 selection in the same way as
    * the other components.
    *
    * @type {object}
    * @memberof fc.utilities
    * @namespace fc.utilities.dataGenerator
    */
    fc.utilities.dataGenerator = function() {

        var mu = 0.1,
            sigma = 0.1,
            startingPrice = 100,
            startingVolume = 100000,
            intraDaySteps = 50,
            volumeNoiseFactor = 0.3,
            toDate = new Date(),
            fromDate = new Date(),
            useFakeBoxMuller = false,
            filter = function(date) {
                return !(date.getDay() === 0 || date.getDay() === 6);
            };

        var generatePrices = function(period, steps) {
            var increments = generateIncrements(period, steps, mu, sigma),
                i, prices = [];
            prices[0] = startingPrice;

            for (i = 1; i < increments.length; i += 1) {
                prices[i] = prices[i - 1] * increments[i];
            }
            return prices;
        };

        var generateVolumes = function(period, steps) {
            var increments = generateIncrements(period, steps, 0, 1),
                i, volumes = [];

            volumeNoiseFactor = Math.max(0, Math.min(volumeNoiseFactor, 1));
            volumes[0] = startingVolume;

            for (i = 1; i < increments.length; i += 1) {
                volumes[i] = volumes[i - 1] * increments[i];
            }
            volumes = volumes.map(function(vol) {
                return Math.floor(vol * (1 - volumeNoiseFactor + Math.random() * volumeNoiseFactor * 2));
            });
            return volumes;
        };

        var generateIncrements = function(period, steps, mu, sigma) {
            var deltaW = [],
                deltaY = period / steps,
                sqrtDeltaY = Math.sqrt(deltaY);

            for (var i = 0; i < steps; i++) {
                var r = useFakeBoxMuller ?
                    fakeBoxMullerTransform() :
                    boxMullerTransform()[0];
                r *= sqrtDeltaY;
                r *= sigma;
                r += (mu - ((sigma * sigma) / 2)) * deltaY;
                deltaW.push(Math.exp(r));
            }
            return deltaW;
        };

        var boxMullerTransform = function() {
            var x = 0, y = 0, rds, c;

            // Get two random numbers from -1 to 1.
            // If the radius is zero or greater than 1, throw them out and pick two new ones
            do {
                x = Math.random() * 2 - 1;
                y = Math.random() * 2 - 1;
                rds = x * x + y * y;
            }
            while (rds === 0 || rds > 1);

            // This is the Box-Muller Transform
            c = Math.sqrt(-2 * Math.log(rds) / rds);

            // It always creates a pair of numbers but it is quite efficient
            // so don't be afraid to throw one away if you don't need both.
            return [x * c, y * c];
        };

        var fakeBoxMullerTransform = function() {
            return (Math.random() * 2 - 1) + (Math.random() * 2 - 1) + (Math.random() * 2 - 1);
        };

        var generate = function() {

            var millisecondsPerYear = 3.15569e10,
                rangeYears = (toDate.getTime() - fromDate.getTime()) / millisecondsPerYear,
                daysIncluded = 0,
                prices,
                volume,
                ohlcv = [],
                daySteps,
                currentStep = 0,
                currentIntraStep = 0;

            var date = new Date(fromDate.getTime());
            while (date <= toDate) {
                if (!filter || filter(date)) {
                    daysIncluded += 1;
                }
                date.setUTCDate(date.getUTCDate() + 1);
            }

            prices = generatePrices(rangeYears, daysIncluded * intraDaySteps);
            volume = generateVolumes(rangeYears, daysIncluded);

            date = new Date(fromDate.getTime());
            while (date <= toDate) {
                if (!filter || filter(date)) {
                    daySteps = prices.slice(currentIntraStep, currentIntraStep + intraDaySteps);
                    ohlcv.push({
                        date: new Date(date.getTime()),
                        open: daySteps[0],
                        high: Math.max.apply({}, daySteps),
                        low: Math.min.apply({}, daySteps),
                        close: daySteps[intraDaySteps - 1],
                        volume: volume[currentStep]
                    });
                    currentIntraStep += intraDaySteps;
                    currentStep += 1;
                }
                date.setUTCDate(date.getUTCDate() + 1);
            }

            return ohlcv;
        };

        var dataGenerator = function(selection) {
        };

        /**
        * Used to trigger the generation of data once generation parameters have been set.
        *
        * @memberof fc.utilities.dataGenerator
        * @method generate
        * @returns the generated data in a format suitable for the chart series components.
        * This constitutes and array of objects with the following fields: date, open, high,
        * low, close, volume. The data will be spaced as daily data with each date being a
        * weekday.
        */
        dataGenerator.generate = function() {
            return generate();
        };

        /**
        * Used to get/set the `mu` property for the brownian motion calculation this dictates the
        * deviation in the standard deviation part of the calculation.
        *
        * @memberof fc.utilities.dataGenerator
        * @method mu
        * @param {decimal} value the standard deviation for the generation equation.
        * @returns the current value if a value is not specified. The default value is 0.1.
        */
        dataGenerator.mu = function(value) {
            if (!arguments.length) {
                return mu;
            }
            mu = value;
            return dataGenerator;
        };

        /**
        * Used to get/set the `sigma` property for the brownian motion calculation this dictates the
        * offset in the standard deviation part of the calculation.
        *
        * @memberof fc.utilities.dataGenerator
        * @method sigma
        * @param {decimal} value the offset for the generation equation.
        * @returns the current value if a value is not specified. The default value is 0.1.
        */
        dataGenerator.sigma = function(value) {
            if (!arguments.length) {
                return sigma;
            }
            sigma = value;
            return dataGenerator;
        };

        /**
        * Used to get/set the starting price which provides the reference point for the generation of
        * the data that follows.
        *
        * @memberof fc.utilities.dataGenerator
        * @method startingPrice
        * @param {decimal} value the starting price for data generation.
        * @returns the current value if a value is not specified. The default value is 100.
        */
        dataGenerator.startingPrice = function(value) {
            if (!arguments.length) {
                return startingPrice;
            }
            startingPrice = value;
            return dataGenerator;
        };

        /**
        * Used to get/set the starting volume which provides the reference point for the generation of
        * the data that follows.
        *
        * @memberof fc.utilities.dataGenerator
        * @method startingVolume
        * @param {decimal} value the starting volume for data generation.
        * @returns the current value if a value is not specified. The default value is 100000.
        */
        dataGenerator.startingVolume = function(value) {
            if (!arguments.length) {
                return startingVolume;
            }
            startingVolume = value;
            return dataGenerator;
        };

        /**
        * Used to get/set the number of data points (tick) calculated for each daily data period.
        *
        * @memberof fc.utilities.dataGenerator
        * @method intraDaySteps
        * @param {decimal} value the number of ticks to evaluate within each daily data set.
        * @returns the current value if a value is not specified. The default value is 50.
        */
        dataGenerator.intraDaySteps = function(value) {
            if (!arguments.length) {
                return intraDaySteps;
            }
            intraDaySteps = value;
            return dataGenerator;
        };

        /**
        * Used to get/set the noise factor for the volume data generator. The volume data is generated
        * randomly within the range the start value +/- the noise factor.
        *
        * @memberof fc.utilities.dataGenerator
        * @method volumeNoiseFactor
        * @param {decimal} value multiplier (factor) for noise added to the random volume data generator.
        * @returns the current value if a value is not specified. The default value is 0.3.
        */
        dataGenerator.volumeNoiseFactor = function(value) {
            if (!arguments.length) {
                return volumeNoiseFactor;
            }
            volumeNoiseFactor = value;
            return dataGenerator;
        };

        /**
        * Used to get/set the data filter function. The function passed to this property will have each date sent
        * to it and it will decide whether that date should appear in the final dataset. The default function
        * will filter weekends:
        *
        * <pre><code>function(date) { return !(date.getDay() === 0 || date.getDay() === 6); };</code></pre>
        *
        * @memberof fc.utilities.dataGenerator
        * @method filter
        * @param {function} value a function which will receive a date object and return a boolean to flag
        * whether a date should be included in the data set or not.
        * @returns the current function if a function is not specified.
        */
        dataGenerator.filter = function(value) {
            if (!arguments.length) {
                return filter;
            }
            filter = value;
            return dataGenerator;
        };

        /**
        * Used to get/set the date the data runs to.
        *
        * @memberof fc.utilities.dataGenerator
        * @method toDate
        * @param {date} value the date of the final data item in the data set.
        * @returns the current value if a value is not specified. This property has no default value and must
        * be set before calling `generate()`.
        */
        dataGenerator.toDate = function(value) {
            if (!arguments.length) {
                return toDate;
            }
            toDate = value;
            return dataGenerator;
        };

        /**
        * Used to get/set the date the data runs from.
        *
        * @memberof fc.utilities.dataGenerator
        * @method fromDate
        * @param {date} value the date of the first data item in the data set.
        * @returns the current value if a value is not specified. This property has no default value and must
        * be set before calling `generate()`.
        */
        dataGenerator.fromDate = function(value) {
            if (!arguments.length) {
                return fromDate;
            }
            fromDate = value;
            return dataGenerator;
        };

        return dataGenerator;
    };
}(fc));