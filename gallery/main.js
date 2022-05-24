function calculateFeatures(tokenData) {
    let H = tokenData

    let T=Uint32Array.from([0,1,s=t=2,3].map(i=>parseInt(H.substr(i*8+5,8),16))),R=(a=1)=>a*(t=T[3],T[3]=T[2],T[2]=T[1],T[1]=s=T[0],t^=t<<11,T[0]^=(t^t>>>8)^(s>>>19),T[0]/2**32);

    // utilities
    let random=(a,b)=>b?a+R()*(b-a):a?R()*a:R()
    let randInt=(a,b)=>random(a,b)|0
    let expRand=(a,b,p=2)=>b?a+(R()**p)*(b-a):a?(R()**p)*a:R()**p
    let array=n=>Array(n).fill(0).map((d,i)=>i)
    let lerp=(a,b,c)=>a+(b-a)*c
    let map=(n,a,b,c,d)=>lerp(c,d,(n-a)/(b-a))

    //features
    let scale = random(1.4, 2) + expRand(0, 1, 3)
    let noiseScale = expRand(600, 2000, 5)
    let selectedFlowfield = [...array(4),0,0,1][randInt(7)]
    let selectedClip = [0,1,2,2,3,3,4,4,5,5,6,6][randInt(12)]
    let fatcaps = random() < .6 ? random(.01, .05) : 0
    let numberOfPaths = lerp(3e4, 15e3, expRand(0, 1)) / (fatcaps ? map(fatcaps,.01, .05, 1, 2) : 1) | 0
    let paletteId = randInt(55)
    let complementaryColor = randInt(2)
    let linecap = random() < .5

    return {
        'Hash': H,

        'Wandering': ['The Drift', 'The Exploration', 'The Journey', 'The Adventure'][selectedFlowfield],
        'Composition': ['The Center','The Block','The Buildings','The Limits','The Alleys','The Grid','The District'][selectedClip],
        'Palette': paletteId,
        'Lights': ['Red', 'Yellow'][complementaryColor],
        'Stroke Style': linecap ? 'Rounded' : 'Straight',
        'Distance': Math.round(map(scale,1.4,4,1,5)),
        'Flow Amount': Math.round(map(numberOfPaths, 75e2, 3e4, 1, 5)),
        'Motion Variation': Math.round(map(noiseScale, 600, 2000, 5, 1)),
        'Fatcaps': fatcaps === 0 ? 0 : Math.round(map(fatcaps, .01, .05, 1, 5)),

        // scale,
        // paletteId,
        // complementaryColor,
        // selectedFlowfield,
        // noiseScale,
        // selectedClip,
        // linecap: linecap ? 'round' : 'butt',
        // fatcaps,
        // numberOfPaths,
    }
};

fetch('./data.json').then(r => r.json()).then(tokens => {
    document.addEventListener('DOMContentLoaded', e => document.querySelectorAll('img').forEach(img => img.onerror = function(){
        this.style.display = 'none'
    }))
    
    document.querySelector('.container').innerHTML = tokens.map((token,i) => {
        const features = calculateFeatures(token.token_hash)
        const paletteId = features['Palette']
        let title = [`Hōrō #${i}`]
        let dataset = []
        for(let key in features) {
            if(key === 'Palette') title.push(`Palette: ${["Zeda","Bafe","Ink","Peck","Coast","Sabske","Went","JayOne","Rezist","Tempt","Chaka","Seen","Tlok","Felon","Swift","Spin","Drastic","Spek","Strem","Jace","Reyes","Sane","Aem","Ander","Dose","Keroz","Skrew","Xone","Guer","Rezo","Werl","Colorz","Spark","Sebl","Kavee","Revolt","Senz","Mkue","Cope2","Mire","Kadism","Omick","Lost","Gris","Sonick","Oxyd","Jazy","Smoker","Anchor","Kadster","Nesta","Trixter","Perl","Drane","Retna","Ogre","Seyce","Dash","Siao","Risk","Bonus","Reaker","Krave","Dear","Mask","Mencer","Pear","Sacer","Ahero","Violon","Junior161","Afroe","Shaken","Abra","Menu","Oclock","Aves","Saet","Rone","Trole","Wovoka","Zephyr","Ozey","Greyer","Brusk","Lobe","Style","Auger","Guess","Spei","Duke"][paletteId]}`)
            else title.push(`${key}: ${features[key]}`)
            
            dataset.push(`data-${key.replace(/\s+/g, '-')}="${features[key]}"`)
        }
        title = title.join('\n')
        dataset = dataset.join(' ')
        return {
            paletteId,
            html: `<div class="box" ${dataset}><img src="${token.image}" title="${title}" loading="lazy"></div>`
        }
    })
    // .sort((a, b) => a.paletteId - b.paletteId)
    .map(d => d.html).join('')
    
    
    const imgs = document.querySelectorAll('.box')
    
    imgs.forEach(img => img.addEventListener('click', e => console.log(img.dataset)))
    
    mediumZoom('img', {
        margin: 10,
        background: 'rgba(10, 10, 10, .9)'
    })
    
    const filters = {
        wandering: 'All',
        fitFormat: 'All',
        composition: 'All',
        palette: 0,
        lights: 'All',
        strokeStyle: 'All',
        distance: 'All',
        flowAmount: 'All',
        motionVariation: 'All',
        fatcaps: 'All',
    }
    
    const filtersProxy = new Proxy(filters, {
        set: function (target, key, value) {
            if(key === 'palette') value = Math.min(55, Math.max(0, value))
            // console.log(`${key} set to ${value}`);
            target[key] = value;
            updateFilters()
            return true;
        }
    })
    
    const updateFilters = (key, value) => {
        let keys = Object.keys(filters).filter(k => k !== 'palette' && filters[k] !== 'All')
        if(filters.palette !== 0) keys.push('palette')
        // console.log(keys)
    
        let l = keys.length
        imgs.forEach(img => {
            let hide = false
            for(let i = 0; i < l && !hide; i ++) {
                if(img.dataset[keys[i]] !== `${filters[keys[i]]}`) hide = true
            }
            img.style.display = hide ? 'none' : ''
        })
    }
    
    const resetFilters = _ => {
        filters.wandering = 'All'
        filters.composition = 'All'
        filters.palette = 0
        filters.lights = 'All'
        filters.strokeStyle = 'All'
        filters.distance = 'All'
        filters.flowAmount = 'All'
        filters.motionVariation = 'All'
        filters.fatcaps = 'All'
        
        imgs.forEach(img => img.style.display = '')
    }
    
    const gui = new ControlKit()
    gui.addPanel({label: 'Filter'})
        .addStringInput(filtersProxy, 'wandering', {
            label: 'Wandering',
            presets: ['All', 'The Meander', 'The Detour', 'The Drift', 'The Exploration', 'The Journey', 'The Excursion', 'The Adventure', 'The Distraction'],
        })
        .addStringInput(filtersProxy, 'fitFormat', {
            label: 'Format',
            presets: ['All', '2:3', '3:2', 'Square', '9:16', '16:9'],
        })
        .addStringInput(filtersProxy, 'composition', {
            label: 'Composition',
            presets: ['All', 'The Center', 'The Block', 'The Buildings', 'The Limits', 'The District'],
        })
        .addNumberInput(filtersProxy, 'palette', {
            label: 'Palette [0:All -> 55]',
            dp: 0,
        })
        .addStringInput(filtersProxy, 'lights', {
            label: 'Lights',
            presets: ['All', 'Red', 'Yellow'],
        })
        .addStringInput(filtersProxy, 'strokeStyle', {
            label: 'Stroke Style',
            presets: ['All', 'Rounded', 'Straight'],
        })
        .addStringInput(filtersProxy, 'distance', {
            label: 'Distance',
            presets: ['All', 1, 2, 3, 4, 5],
        })
        .addStringInput(filtersProxy, 'flowAmount', {
            label: 'Flow Amount',
            presets: ['All', 1, 2, 3, 4, 5],
        })
        .addStringInput(filtersProxy, 'motionVariation', {
            label: 'Motion Variation',
            presets: ['All', 1, 2, 3, 4, 5],
        })
        .addStringInput(filtersProxy, 'fatcaps', {
            label: 'Fatcaps',
            presets: ['All', 0, 1, 2, 3, 4, 5],
        })
        .addButton('Reset Filters', resetFilters)
    
    document.querySelector('#controlKit').style.position = 'fixed'
    document.querySelector('#controlKit>.panel').style.width = '250px'
    document.querySelectorAll('#controlKit .panel .group-list .group .sub-group-list .sub-group .wrap .wrap').forEach(d => d.style.width = '50%')
    document.querySelectorAll('#controlKit .panel .group-list .group .sub-group-list .sub-group .wrap .label').forEach(d => d.style.width = '50%')
}).catch(e => console.log(e))