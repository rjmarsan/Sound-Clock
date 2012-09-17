function playExample(callbk) {
    var Shaker = function(audiolet) {
        AudioletGroup.call(this, audiolet, 0, 1);

        var now = new Date();


        // White noise source
        this.white = new WhiteNoise(audiolet);

        // Gain envelope
        this.gainEnv = new PercussiveEnvelope(audiolet, 1, 0.1, 0.1,
            function() {
                // Remove the group ASAP when env is complete
                this.audiolet.scheduler.addRelative(0,
                                                    this.remove.bind(this));
            }.bind(this)
        );

        // Filter
        var note = now.getHours()*2 + 65;
        var filterfreq = Math.pow(2, (note-69)/12)*440;
        var q = Math.pow(now.getMinutes(),1.4)/5+2;//now.getMinutes()+2;

        console.log("freq "+filterfreq+ "note:"+note+ " q:"+q);

        var gain = 0.3 + q / 50;

        this.gainEnvMulAdd = new MulAdd(audiolet, 0.5*gain);
        this.gain = new Gain(audiolet);

        this.filter = new BandPassFilter(audiolet, filterfreq);
        var lastfilter = this.filter;
        for (var i=1; i<q; i++) {
            var newfilter = new BandPassFilter(audiolet, filterfreq);
            lastfilter.connect(newfilter);
            lastfilter = newfilter;
        }

        this.upMixer = new UpMixer(audiolet, 2);

        // Connect the main signal path
        this.white.connect(this.filter);
        lastfilter.connect(this.gain);

        // Connect the gain envelope
        this.gainEnv.connect(this.gainEnvMulAdd);
        this.gainEnvMulAdd.connect(this.gain, 0, 1);
        this.gain.connect(this.upMixer);
        this.upMixer.connect(this.outputs[0]);
    }
    extend(Shaker, AudioletGroup);

    var Demo = function() {
        this.audiolet = new Audiolet();

        // Set BPM
        this.audiolet.scheduler.setTempo(60);

        // Base frequency and scale to work from
        this.c2Frequency = 65.4064;
        this.scale = new MajorScale();

        this.playShaker();
    }


    Demo.prototype.playShaker = function() {
        // Shaker - four to the floor on the off-beat
        // Scheduled as a poly synth
        this.audiolet.scheduler.addRelative(0.5, function() {
            this.audiolet.scheduler.play([], 1,
                function() {
                    var shaker = new Shaker(this.audiolet);
                    shaker.connect(this.audiolet.output);
                    callbk();
                }.bind(this)
            );
        }.bind(this));
    }

    // Run the demo
    var demo = new Demo();
};
