# Swarm Atlas

Swarm Atlas is an interactive browser lab for learning Particle Swarm Optimization (PSO). Watch particles search for a minimum or maximum using their previous velocity, personal best position, and the best position found by the swarm.

[Open the live simulator](https://swarm-atlas-pso-field-lab.rollingblanket64.chatgpt.site/)

## Use the simulator

1. Choose the Peaks landscape, Rastrigin field, quadratic bowl, or inverted parabola.
2. Adjust swarm size, inertia, personal pull, and social pull. Reset starts the experiment from the same seed for a fixed swarm size.
3. Press **Play** to run automatically, **Pause** to inspect the current state, or **Step** to advance one phase. Each iteration computes velocity, moves and evaluates the particles, then updates their best positions.
4. Track a particle on the landscape or in the inspector to see its trail and the three terms that contribute to its velocity. Switch to **Convergence** to see how the best recorded fitness changes.

## Reproduce the hand calculation

Open **Worked example**, choose **Replay in simulator**, and press **Step** three times. The example minimizes *f(x) = x²* with initial positions 4, −3, and 2, zero velocities, and the first iteration’s recorded random draws from the course lecture notes.

| Particle | New velocity | New position | New fitness |
| --- | ---: | ---: | ---: |
| P01 | −2.58 | 1.42 | 2.0164 |
| P02 | 1.875 | −1.125 | 1.265625 |
| P03 | 0 | 2 | 4 |

The in-app check compares all three velocities, positions, fitness values, and personal bests. It also verifies that P02 becomes the global best at *x = −1.125*. Later iterations in the replay use seeded draws.

## Run or edit locally

Download or clone this repository and open `index.html` in a browser. The built file works offline and needs no server or dependencies.

The source uses HTML, CSS, JavaScript, and Canvas. Edit the source files and run `node build.cjs` from the repository root to regenerate the standalone HTML. Node.js is only needed to rebuild.

| File | Role |
| --- | --- |
| `page.html` and `style.css` | Interface and responsive layout |
| `engine.js` | PSO update rules, objectives, and lecture check |
| `map.js` | Contours, particle trails, and convergence chart |
| `app.js` | Controls, step explanations, and inspector |
| `index.html` | Ready-to-run simulator |

## References

- *PSO-Lecture Notes*, sections 2–6. Problem 1 supplies the hand calculation.
- A. P. Engelbrecht, *Computational Intelligence: An Introduction*, 2nd ed., chapter 16, sections 16.1.1 and 16.1.4.
